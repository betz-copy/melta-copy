import Neo4jClient from '../../../utils/neo4j';
import { IEntity } from '../../entities/interface';
import { IBrokenRule } from '../interfaces';
import { ServiceError } from '../../error';
import EntityManager from '../../entities/manager';
import RelationshipManager from '../../relationships/manager';
import config from '../../../config';
import { getNeo4jDateTime } from '../../../utils/neo4j/lib';
import { trycatch } from '../../../utils/lib';
import {
    airportEntityTemplate,
    allEntityTemplateIds,
    allEntityTemplates,
    allRelationshipTemplateIds,
    allRelationshipTemplates,
    departureFromRelationshipTemplate,
    flightEntityTemplate,
    flightsOnRelationshipTemplate,
    mockEntityTemplatesRoutes,
    mockRelationshipTemplatesRoutes,
    mockRulesRoutes,
    noOverlappingFlightsInTrip,
    oneTravelAgentPerFlight,
    travelAgentEntityTemplate,
    tripConnectedToFlightRelationshipTemplate,
    tripEntityTemplate,
    warnOnEveryFlightOnActiveZone,
} from '../../../externalServices/tests/externalServices.mock';
import { IMongoRelationshipTemplate } from '../../../externalServices/relationshipTemplateManager';
import { getMockAdapterEntityTemplateManager, getMockAdapterRelationshipTemplateManager } from '../../../externalServices/tests/axios.mock';

const { neo4j } = config;

const createRelationshipAndExpectRuleBlock = async (
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    relationshipTemplate: IMongoRelationshipTemplate,
    brokenRule: IBrokenRule,
) => {
    const { err } = await trycatch(() =>
        RelationshipManager.createRelationshipByEntityIds(
            {
                templateId: relationshipTemplate._id,
                properties: { testProp: 'testProp' },
                sourceEntityId: sourceEntity.properties._id,
                destinationEntityId: destinationEntity.properties._id,
            },
            relationshipTemplate,
            [],
        ),
    );
    expect(err).toStrictEqual(
        new ServiceError(400, '[NEO4J] relationship creation is blocked by rules.', {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules: [
                {
                    ruleId: brokenRule.ruleId,
                    relationshipIds: expect.any(Array),
                },
            ],
        }),
    );
    expect((err as any).metadata.brokenRules[0].relationshipIds.sort()).toStrictEqual(brokenRule.relationshipIds.sort());
};

const createRelationshipAndExpectToSucceed = async (
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    relationshipTemplate: IMongoRelationshipTemplate,
    ignoredRules: IBrokenRule[] = [],
) => {
    const relationship = await RelationshipManager.createRelationshipByEntityIds(
        {
            templateId: relationshipTemplate._id,
            properties: { testProp: 'testProp' },
            sourceEntityId: sourceEntity.properties._id,
            destinationEntityId: destinationEntity.properties._id,
        },
        relationshipTemplate,
        ignoredRules,
    );

    expect(relationship.templateId).toStrictEqual(relationshipTemplate._id);
    expect(relationship.sourceEntityId).toStrictEqual(sourceEntity.properties._id);
    expect(relationship.destinationEntityId).toStrictEqual(destinationEntity.properties._id);

    return relationship;
};

const deleteRelationshipAndExpectRuleBlock = async (relationshipId: string, brokenRule: IBrokenRule) => {
    const { err } = await trycatch(() => RelationshipManager.deleteRelationshipById(relationshipId, []));
    expect(err).toStrictEqual(
        new ServiceError(400, '[NEO4J] relationship deletion is blocked by rules.', {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules: [
                {
                    ruleId: brokenRule.ruleId,
                    relationshipIds: expect.any(Array),
                },
            ],
        }),
    );
    expect((err as any).metadata.brokenRules[0].relationshipIds.sort()).toStrictEqual(brokenRule.relationshipIds.sort());
};

const deleteRelationshipAndExpectToSucceed = async (
    relationshipId: string,
    relationshipTemplateId: string,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    ignoredRules: IBrokenRule[] = [],
) => {
    const deletedRelationship = await RelationshipManager.deleteRelationshipById(relationshipId, ignoredRules);

    expect(deletedRelationship.templateId).toStrictEqual(relationshipTemplateId);
    expect(deletedRelationship.sourceEntityId).toStrictEqual(sourceEntity.properties._id);
    expect(deletedRelationship.destinationEntityId).toStrictEqual(destinationEntity.properties._id);
};

describe('Relationship manager test rules', () => {
    const mockEntityTemplateManager = getMockAdapterEntityTemplateManager();
    const mockRelationshipTemplateManager = getMockAdapterRelationshipTemplateManager();

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    describe('Create relationship', () => {
        describe('Rule 1 - One travel agent per flight', () => {
            let firstTravelAgent: IEntity;
            let secondTravelAgent: IEntity;
            let flight: IEntity;
            let trip: IEntity;
            let airport: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;

            beforeAll(async () => {
                const rules = [oneTravelAgentPerFlight];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                firstTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name1',
                        lastName: 'Name1',
                        agentId: '1',
                    },
                });

                secondTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name2',
                        lastName: 'Name2',
                        agentId: '2',
                    },
                });

                flight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(),
                        landingDate: getNeo4jDateTime(),
                    },
                });

                trip = await EntityManager.createEntity({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        name: 'My trip',
                        destination: 'New York',
                    },
                });

                airport = await EntityManager.createEntity({
                    templateId: airportEntityTemplate._id,
                    properties: {
                        airportName: 'New York Airport',
                        airportId: '1234',
                        country: 'New York',
                    },
                });
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${firstTravelAgent.properties._id}" })
                    MATCH (e2 { _id: "${secondTravelAgent.properties._id}" })
                    MATCH (e3 { _id: "${flight.properties._id}" })
                    MATCH (e4 { _id: "${trip.properties._id}" })
                    MATCH (e5 { _id: "${airport.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4,e5`,
                    () => {},
                );
            });

            it('Should create a new relationship', async () => {
                const relationship = await createRelationshipAndExpectToSucceed(firstTravelAgent, flight, flightsOnRelationshipTemplate);

                firstRelationshipId = relationship.properties._id;
            });

            it('Should fail to create a new relationship because one already exists', async () => {
                await createRelationshipAndExpectRuleBlock(secondTravelAgent, flight, flightsOnRelationshipTemplate, {
                    ruleId: oneTravelAgentPerFlight._id,
                    relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                });
            });

            it('Should ignore failed rule and create relationship', async () => {
                const relationship = await createRelationshipAndExpectToSucceed(secondTravelAgent, flight, flightsOnRelationshipTemplate, [
                    {
                        relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                        ruleId: oneTravelAgentPerFlight._id,
                    },
                ]);

                secondRelationshipId = relationship.properties._id;
            });

            it('Should fail to create relationship between trip and flight, because dependent in rule', async () => {
                await createRelationshipAndExpectRuleBlock(flight, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: oneTravelAgentPerFlight._id,
                    relationshipIds: [firstRelationshipId, secondRelationshipId],
                });
            });

            it('Should create relationship between airport and flight, because not dependent rule', async () => {
                await createRelationshipAndExpectToSucceed(flight, airport, departureFromRelationshipTemplate);
            });
        });

        describe('Rule 2 - No Overlapping Flights In Trip', () => {
            let trip: IEntity;
            let firstFlight: IEntity;
            let secondFlightNotOverlapping: IEntity;
            let thirdFlightOverlapping: IEntity;

            let firstRelationshipId: string;

            beforeAll(async () => {
                const rules = [noOverlappingFlightsInTrip];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = await EntityManager.createEntity({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        name: 'My trip',
                        destination: 'New York',
                    },
                });

                firstFlight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(new Date('2022-04-01T17:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-01T19:00:00.000Z')),
                    },
                });

                secondFlightNotOverlapping = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '2',
                        departureDate: getNeo4jDateTime(new Date('2022-04-20T17:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-20T19:00:00.000Z')),
                    },
                });

                thirdFlightOverlapping = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '3',
                        departureDate: getNeo4jDateTime(new Date('2022-04-01T08:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-01T08:30:00.000Z')),
                    },
                });
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${trip.properties._id}" })
                    MATCH (e2 { _id: "${firstFlight.properties._id}" })
                    MATCH (e3 { _id: "${secondFlightNotOverlapping.properties._id}" })
                    MATCH (e4 { _id: "${thirdFlightOverlapping.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4`,
                    () => {},
                );
            });

            it('Should create a new first relationship', async () => {
                const relationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                );

                expect(relationship.templateId).toStrictEqual(tripConnectedToFlightRelationshipTemplate._id);
                expect(relationship.sourceEntityId).toStrictEqual(firstFlight.properties._id);
                expect(relationship.destinationEntityId).toStrictEqual(trip.properties._id);

                firstRelationshipId = relationship.properties._id;
            });
            it('Should create a new second relationship because not overlapping', async () => {
                const relationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondFlightNotOverlapping.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                );

                expect(relationship.templateId).toStrictEqual(tripConnectedToFlightRelationshipTemplate._id);
                expect(relationship.sourceEntityId).toStrictEqual(secondFlightNotOverlapping.properties._id);
                expect(relationship.destinationEntityId).toStrictEqual(trip.properties._id);
            });
            it('Should fail to create a new relationship because overlapping', async () => {
                await createRelationshipAndExpectRuleBlock(thirdFlightOverlapping, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: noOverlappingFlightsInTrip._id,
                    relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                });
            });
        });

        describe('Rule 3 - Warn On Every Flight On Active Zone', () => {
            let flight: IEntity;
            let trip: IEntity;

            beforeAll(async () => {
                const rules = [warnOnEveryFlightOnActiveZone];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = await EntityManager.createEntity({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        name: 'My trip',
                        destination: 'New York',
                        active: true,
                    },
                });

                flight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(),
                        landingDate: getNeo4jDateTime(),
                    },
                });
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${flight.properties._id}" })
                    MATCH (e2 { _id: "${trip.properties._id}" })
                    DETACH DELETE e1,e2`,
                    () => {},
                );
            });

            it('Should fail to create a new relationship (because needs to warn on every flight)', async () => {
                await createRelationshipAndExpectRuleBlock(flight, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: warnOnEveryFlightOnActiveZone._id,
                    relationshipIds: [config.createdRelationshipIdInBrokenRules],
                });
            });
        });
    });

    describe('Delete relationship', () => {
        describe('Rule 1 - One travel agent per flight', () => {
            let firstTravelAgent: IEntity;
            let secondTravelAgent: IEntity;
            let thirdTravelAgent: IEntity;
            let flight: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;
            let thirdRelationshipId: string;

            beforeAll(async () => {
                const rules = [oneTravelAgentPerFlight];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                firstTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name1',
                        lastName: 'Name1',
                        agentId: '1',
                    },
                });

                secondTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name2',
                        lastName: 'Name2',
                        agentId: '2',
                    },
                });

                thirdTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name3',
                        lastName: 'Name3',
                        agentId: '3',
                    },
                });

                flight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(),
                        landingDate: getNeo4jDateTime(),
                    },
                });

                const firstRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [],
                );
                firstRelationshipId = firstRelationship.properties._id;

                const secondRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [{ ruleId: oneTravelAgentPerFlight._id, relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId] }],
                );
                secondRelationshipId = secondRelationship.properties._id;

                const thirdRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: thirdTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [
                        {
                            ruleId: oneTravelAgentPerFlight._id,
                            relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId, secondRelationshipId],
                        },
                    ],
                );
                thirdRelationshipId = thirdRelationship.properties._id;
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${firstTravelAgent.properties._id}" })
                    MATCH (e2 { _id: "${secondTravelAgent.properties._id}" })
                    MATCH (e3 { _id: "${thirdTravelAgent.properties._id}" })
                    MATCH (e4 { _id: "${flight.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4`,
                    () => {},
                );
            });

            it('Should fail to delete third relationship because still rule fails', async () => {
                await deleteRelationshipAndExpectRuleBlock(thirdRelationshipId, {
                    ruleId: oneTravelAgentPerFlight._id,
                    relationshipIds: [firstRelationshipId, secondRelationshipId],
                });
            });

            it('Should ignore failed rule and delete third relationship', async () => {
                await deleteRelationshipAndExpectToSucceed(thirdRelationshipId, flightsOnRelationshipTemplate._id, thirdTravelAgent, flight, [
                    {
                        ruleId: oneTravelAgentPerFlight._id,
                        relationshipIds: [firstRelationshipId, secondRelationshipId],
                    },
                ]);
            });

            it('Should delete second relationship because rule passes', async () => {
                await deleteRelationshipAndExpectToSucceed(secondRelationshipId, flightsOnRelationshipTemplate._id, secondTravelAgent, flight, []);
            });
        });
        describe('Rule 2 - No Overlapping Flights In Trip', () => {
            let trip: IEntity;
            let firstFlight: IEntity;
            let secondFlightNotOverlapping: IEntity;
            let thirdFlightOverlapping: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;
            let thirdRelationshipId: string;

            beforeAll(async () => {
                const rules = [noOverlappingFlightsInTrip];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = await EntityManager.createEntity({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        name: 'My trip',
                        destination: 'New York',
                    },
                });

                firstFlight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(new Date('2022-04-01T17:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-01T19:00:00.000Z')),
                    },
                });

                secondFlightNotOverlapping = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '2',
                        departureDate: getNeo4jDateTime(new Date('2022-04-20T17:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-20T19:00:00.000Z')),
                    },
                });

                thirdFlightOverlapping = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '3',
                        departureDate: getNeo4jDateTime(new Date('2022-04-01T08:00:00.000Z')),
                        landingDate: getNeo4jDateTime(new Date('2022-04-01T08:30:00.000Z')),
                    },
                });

                const firstRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                );
                firstRelationshipId = firstRelationship.properties._id;

                const secondRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondFlightNotOverlapping.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                );
                secondRelationshipId = secondRelationship.properties._id;

                const thirdRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: thirdFlightOverlapping.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [
                        {
                            ruleId: noOverlappingFlightsInTrip._id,
                            relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                        },
                    ],
                );
                thirdRelationshipId = thirdRelationship.properties._id;
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${trip.properties._id}" })
                    MATCH (e2 { _id: "${firstFlight.properties._id}" })
                    MATCH (e3 { _id: "${secondFlightNotOverlapping.properties._id}" })
                    MATCH (e4 { _id: "${thirdFlightOverlapping.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4`,
                    () => {},
                );
            });

            it('Should fail to delete second relationship because still overlapping', async () => {
                await deleteRelationshipAndExpectRuleBlock(secondRelationshipId, {
                    ruleId: noOverlappingFlightsInTrip._id,
                    relationshipIds: [firstRelationshipId, thirdRelationshipId],
                });
            });
            it('Should ignore failed rule and delete second relationship', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    secondRelationshipId,
                    tripConnectedToFlightRelationshipTemplate._id,
                    secondFlightNotOverlapping,
                    trip,
                    [
                        {
                            ruleId: noOverlappingFlightsInTrip._id,
                            relationshipIds: [firstRelationshipId, thirdRelationshipId],
                        },
                    ],
                );
            });
            it('Should delete second relationship because rule passes', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    thirdRelationshipId,
                    tripConnectedToFlightRelationshipTemplate._id,
                    thirdFlightOverlapping,
                    trip,
                    [],
                );
            });
        });
        describe('Rule 3 - Warn On Every Flight On Active Zone', () => {
            let trip: IEntity;
            let firstFlight: IEntity;
            let secondFlight: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;

            beforeAll(async () => {
                const rules = [warnOnEveryFlightOnActiveZone];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = await EntityManager.createEntity({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        name: 'My trip',
                        destination: 'New York',
                        active: true,
                    },
                });

                firstFlight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: getNeo4jDateTime(),
                        landingDate: getNeo4jDateTime(),
                    },
                });

                secondFlight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '2',
                        departureDate: getNeo4jDateTime(),
                        landingDate: getNeo4jDateTime(),
                    },
                });

                const firstRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [
                        {
                            ruleId: warnOnEveryFlightOnActiveZone._id,
                            relationshipIds: [config.createdRelationshipIdInBrokenRules],
                        },
                    ],
                );
                firstRelationshipId = firstRelationship.properties._id;

                const secondRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [
                        {
                            ruleId: warnOnEveryFlightOnActiveZone._id,
                            relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                        },
                    ],
                );
                secondRelationshipId = secondRelationship.properties._id;
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${trip.properties._id}" })
                    MATCH (e2 { _id: "${firstFlight.properties._id}" })
                    MATCH (e3 { _id: "${secondFlight.properties._id}" })
                    DETACH DELETE e1,e2,e3`,
                    () => {},
                );
            });

            it('Should fail to delete second relationship because still rule fails', async () => {
                await deleteRelationshipAndExpectRuleBlock(secondRelationshipId, {
                    ruleId: warnOnEveryFlightOnActiveZone._id,
                    relationshipIds: [firstRelationshipId],
                });
            });
            it('Should ignore failed rule and delete second relationship', async () => {
                await deleteRelationshipAndExpectToSucceed(secondRelationshipId, tripConnectedToFlightRelationshipTemplate._id, secondFlight, trip, [
                    {
                        ruleId: warnOnEveryFlightOnActiveZone._id,
                        relationshipIds: [firstRelationshipId],
                    },
                ]);
            });
        });
    });
});
