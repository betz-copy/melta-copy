import Neo4jClient from '../../../utils/neo4j';
import config from '../../../config';
import EntityManager from '../../entities/manager';
import {
    allEntityTemplateIds,
    allEntityTemplates,
    allRelationshipTemplateIds,
    allRelationshipTemplates,
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
import { IEntity } from '../../entities/interface';
import RelationshipManager from '../../relationships/manager';
import { trycatch } from '../../../utils/lib';
import { ServiceError } from '../../error';
import { IBrokenRule } from '../interfaces';
import { addStringFieldsAndNormalizeDateValues } from '../../entities/validator.template';
import { IMongoEntityTemplate } from '../../../externalServices/entityTemplateManager';
import { getMockAdapterEntityTemplateManager, getMockAdapterRelationshipTemplateManager } from '../../../externalServices/tests/axios.mock';

const { neo4j } = config;

const updateEntityAndExpectRuleBlock = async (
    entityId: string,
    entityProperties: Record<string, any>,
    entityTemplate: IMongoEntityTemplate,
    brokenRule: IBrokenRule,
) => {
    const { err } = await trycatch(() =>
        EntityManager.updateEntityById(entityId, addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate), entityTemplate, []),
    );

    expect(err).toStrictEqual(
        new ServiceError(400, '[NEO4J] entity update is blocked by rules.', {
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

const updateEntityAndExpectToSucceed = async (
    entityId: string,
    entityProperties: Record<string, any>,
    entityTemplate: IMongoEntityTemplate,
    ignoredRules: IBrokenRule[] = [],
) => {
    const updatedEntity = await EntityManager.updateEntityById(
        entityId,
        addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate),
        entityTemplate,
        ignoredRules,
    );

    expect(updatedEntity).toStrictEqual({
        templateId: entityTemplate._id,
        properties: {
            ...entityProperties,
            _id: entityId,
            disabled: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        },
    });

    return updatedEntity;
};

describe('Entity manager test rules', () => {
    const mockEntityTemplateManager = getMockAdapterEntityTemplateManager();
    const mockRelationshipTemplateManager = getMockAdapterRelationshipTemplateManager();

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    describe('Update entity', () => {
        describe('Rule 1 - One travel agent per flight', () => {
            let firstTravelAgent: IEntity;
            let secondTravelAgent: IEntity;
            let flight: IEntity;
            let trip: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;

            beforeAll(async () => {
                const rules = [oneTravelAgentPerFlight];

                mockRulesRoutes(mockRelationshipTemplateManager, rules, allEntityTemplateIds, allRelationshipTemplateIds);
                mockRelationshipTemplatesRoutes(mockRelationshipTemplateManager, allRelationshipTemplates, allEntityTemplateIds);
                mockEntityTemplatesRoutes(mockEntityTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                firstTravelAgent = await EntityManager.createEntity(
                    {
                        templateId: travelAgentEntityTemplate._id,
                        properties: {
                            firstName: 'Name1',
                            lastName: 'Name1',
                            agentId: '1',
                        },
                    },
                    travelAgentEntityTemplate,
                );

                secondTravelAgent = await EntityManager.createEntity(
                    {
                        templateId: travelAgentEntityTemplate._id,
                        properties: {
                            firstName: 'Name2',
                            lastName: 'Name2',
                            agentId: '2',
                        },
                    },
                    travelAgentEntityTemplate,
                );

                flight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '1',
                            departureDate: new Date().toISOString(),
                            landingDate: new Date().toISOString(),
                        },
                    },
                    flightEntityTemplate,
                );

                trip = await EntityManager.createEntity(
                    {
                        templateId: tripEntityTemplate._id,
                        properties: {
                            name: 'My trip',
                            destination: 'New York',
                        },
                    },
                    tripEntityTemplate,
                );

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

                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: flight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [{ ruleId: oneTravelAgentPerFlight._id, relationshipIds: [firstRelationshipId, secondRelationshipId] }],
                );
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${firstTravelAgent.properties._id}" })
                    MATCH (e2 { _id: "${secondTravelAgent.properties._id}" })
                    MATCH (e3 { _id: "${flight.properties._id}" })
                    MATCH (e4 { _id: "${trip.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4`,
                    () => {},
                );
            });

            it('Should edit trip destination, because not dependent in rule', async () => {
                await updateEntityAndExpectToSucceed(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        destination: 'different destination',
                    },
                    tripEntityTemplate,
                );
            });

            it('Should fail to edit trip name, because dependent in rule', async () => {
                await updateEntityAndExpectRuleBlock(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        name: 'different name 1',
                    },
                    tripEntityTemplate,
                    {
                        ruleId: oneTravelAgentPerFlight._id,
                        relationshipIds: [firstRelationshipId, secondRelationshipId],
                    },
                );
            });

            it('Should ignore failed rule and, update trip name', async () => {
                await updateEntityAndExpectToSucceed(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        name: 'different name 2',
                    },
                    tripEntityTemplate,
                    [
                        {
                            ruleId: oneTravelAgentPerFlight._id,
                            relationshipIds: [firstRelationshipId, secondRelationshipId],
                        },
                    ],
                );
            });

            it('Should edit trip to "justForTesting", because rule passes', async () => {
                await updateEntityAndExpectToSucceed(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        name: 'justForTesting',
                    },
                    tripEntityTemplate,
                );
            });
        });

        describe('Rule 2 - No Overlapping Flights In Trip', () => {
            let trip: IEntity;
            let firstFlight: IEntity;
            let secondFlight: IEntity;
            let thirdFlight: IEntity;

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
                trip = await EntityManager.createEntity(
                    {
                        templateId: tripEntityTemplate._id,
                        properties: {
                            name: 'My trip',
                            destination: 'New York',
                        },
                    },
                    tripEntityTemplate,
                );

                firstFlight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '1',
                            departureDate: '2022-04-01T17:00:00.000Z',
                            landingDate: '2022-04-01T19:00:00.000Z',
                        },
                    },
                    flightEntityTemplate,
                );

                secondFlight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '2',
                            departureDate: '2022-04-02T17:00:00.000Z',
                            landingDate: '2022-04-02T19:00:00.000Z',
                        },
                    },
                    flightEntityTemplate,
                );

                thirdFlight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '3',
                            departureDate: '2022-04-03T08:00:00.000Z',
                            landingDate: '2022-04-03T08:30:00.000Z',
                        },
                    },
                    flightEntityTemplate,
                );

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
                        sourceEntityId: secondFlight.properties._id,
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
                        sourceEntityId: thirdFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                );
                thirdRelationshipId = thirdRelationship.properties._id;
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${trip.properties._id}" })
                    MATCH (e2 { _id: "${firstFlight.properties._id}" })
                    MATCH (e3 { _id: "${secondFlight.properties._id}" })
                    MATCH (e4 { _id: "${thirdFlight.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4`,
                    () => {},
                );
            });

            it('Should fail to update third flight date because will overlap with first flight and rule fails', async () => {
                await updateEntityAndExpectRuleBlock(
                    thirdFlight.properties._id,
                    {
                        ...thirdFlight.properties,
                        departureDate: '2022-04-01T08:00:00.000Z',
                    },
                    flightEntityTemplate,
                    {
                        ruleId: noOverlappingFlightsInTrip._id,
                        relationshipIds: [firstRelationshipId, thirdRelationshipId],
                    },
                );
            });

            it('Should ignore failed rule and, update third flight date', async () => {
                await updateEntityAndExpectToSucceed(
                    thirdFlight.properties._id,
                    {
                        ...thirdFlight.properties,
                        departureDate: '2022-04-01T08:00:00.000Z',
                    },
                    flightEntityTemplate,
                    [
                        {
                            ruleId: noOverlappingFlightsInTrip._id,
                            relationshipIds: [firstRelationshipId, thirdRelationshipId],
                        },
                    ],
                );
            });

            it('Should fail to update second flight date to untaken, but rule still fails', async () => {
                await updateEntityAndExpectRuleBlock(
                    secondFlight.properties._id,
                    {
                        ...secondFlight.properties,
                        departureDate: '2022-04-04T08:00:00.000Z',
                    },
                    flightEntityTemplate,
                    {
                        ruleId: noOverlappingFlightsInTrip._id,
                        relationshipIds: [firstRelationshipId, thirdRelationshipId],
                    },
                );
            });

            it('Should fail to update second flight date because overlaps with first and third flights and rule fails', async () => {
                await updateEntityAndExpectRuleBlock(
                    secondFlight.properties._id,
                    {
                        ...secondFlight.properties,
                        departureDate: '2022-04-01T08:00:00.000Z',
                    },
                    flightEntityTemplate,
                    {
                        ruleId: noOverlappingFlightsInTrip._id,
                        relationshipIds: [firstRelationshipId, secondRelationshipId, thirdRelationshipId],
                    },
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
                trip = await EntityManager.createEntity(
                    {
                        templateId: tripEntityTemplate._id,
                        properties: {
                            name: 'My trip',
                            destination: 'New York',
                            active: false,
                        },
                    },
                    tripEntityTemplate,
                );

                firstFlight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '1',
                            departureDate: new Date().toISOString(),
                            landingDate: new Date().toISOString(),
                        },
                    },
                    flightEntityTemplate,
                );

                secondFlight = await EntityManager.createEntity(
                    {
                        templateId: flightEntityTemplate._id,
                        properties: {
                            flightNumber: '2',
                            departureDate: new Date().toISOString(),
                            landingDate: new Date().toISOString(),
                        },
                    },
                    flightEntityTemplate,
                );

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
                        sourceEntityId: secondFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
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

            it('Should fail to trip to active, because rule will fail', async () => {
                await updateEntityAndExpectRuleBlock(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        active: true,
                    },
                    tripEntityTemplate,
                    {
                        ruleId: warnOnEveryFlightOnActiveZone._id,
                        relationshipIds: [firstRelationshipId, secondRelationshipId],
                    },
                );
            });

            it('Should ignore failed rule and, update trip to active', async () => {
                await updateEntityAndExpectToSucceed(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        active: true,
                    },
                    tripEntityTemplate,
                    [
                        {
                            ruleId: warnOnEveryFlightOnActiveZone._id,
                            relationshipIds: [firstRelationshipId, secondRelationshipId],
                        },
                    ],
                );
            });

            it('Should edit trip destination, because not dependent in rule', async () => {
                await updateEntityAndExpectToSucceed(
                    trip.properties._id,
                    {
                        ...trip.properties,
                        destination: 'different destination',
                    },
                    tripEntityTemplate,
                );
            });
        });
    });
});
