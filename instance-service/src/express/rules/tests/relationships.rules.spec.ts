import config from '../../../config';
import { IMongoRelationshipTemplate } from '../../../externalServices/templates/interfaces/relationshipTemplates';
import { getMockAdapterTemplateManager } from '../../../externalServices/tests/axios.mock';
import {
    generateTemplates,
    mockEntityTemplatesRoutes,
    mockRelationshipTemplatesRoutes,
    mockRulesRoutes,
} from '../../../externalServices/tests/externalServices.mock';
import { trycatch } from '../../../utils/lib';
import Neo4jClient from '../../../utils/neo4j';
import { IEntity } from '../../entities/interface';
import EntityManager from '../../entities/manager';
import { BadRequestError } from '../../error';
import RelationshipManager from '../../relationships/manager';
import { IBrokenRule } from '../interfaces';
import { sortBrokenRules } from '../throwIfActionCausedRuleFailures';

const { neo4j } = config;

const {
    airportEntityTemplate,
    allEntityTemplateIds,
    allEntityTemplates,
    allRelationshipTemplates,
    departureFromRelationshipTemplate,
    flightEntityTemplate,
    flightsOnRelationshipTemplate,
    noOverlappingFlightsInTrip,
    oneTravelAgentPerFlight,
    travelAgentEntityTemplate,
    tripConnectedToAirportRelationshipTemplate,
    tripConnectedToFlightRelationshipTemplate,
    tripEntityTemplate,
    warnOnEveryFlightDepartureFromAirportWithActiveTrip,
} = generateTemplates();

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
            neo4j.mockUserId,
        ),
    );
    expect(err).toStrictEqual(
        new BadRequestError('[NEO4J] action is blocked by rules.', {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules: [
                {
                    ruleId: brokenRule.ruleId,
                    brokenRules: expect.any(Array),
                },
            ],
        }),
    );
    expect(sortBrokenRules((err as any).metadata.brokenRules)).toStrictEqual(sortBrokenRules([brokenRule]));
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
        neo4j.mockUserId,
    );

    expect(relationship.templateId).toStrictEqual(relationshipTemplate._id);
    expect(relationship.sourceEntityId).toStrictEqual(sourceEntity.properties._id);
    expect(relationship.destinationEntityId).toStrictEqual(destinationEntity.properties._id);

    return relationship;
};

const deleteRelationshipAndExpectRuleBlock = async (relationshipId: string, brokenRule: IBrokenRule) => {
    const { err } = await trycatch(() => RelationshipManager.deleteRelationshipById(relationshipId, [], neo4j.mockUserId));
    expect(err).toStrictEqual(
        new BadRequestError('[NEO4J] action is blocked by rules.', {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules: [
                {
                    ruleId: brokenRule.ruleId,
                    relationshipIds: expect.any(Array),
                },
            ],
        }),
    );
    expect(sortBrokenRules((err as any).metadata.brokenRules)).toStrictEqual(sortBrokenRules([brokenRule]));
};

const deleteRelationshipAndExpectToSucceed = async (
    relationshipId: string,
    relationshipTemplateId: string,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    ignoredRules: IBrokenRule[] = [],
) => {
    const deletedRelationship = await RelationshipManager.deleteRelationshipById(relationshipId, ignoredRules, neo4j.mockUserId);

    expect(deletedRelationship.templateId).toStrictEqual(relationshipTemplateId);
    expect(deletedRelationship.sourceEntityId).toStrictEqual(sourceEntity.properties._id);
    expect(deletedRelationship.destinationEntityId).toStrictEqual(destinationEntity.properties._id);
};

describe('Relationship manager test rules', () => {
    const mockTemplateManager = getMockAdapterTemplateManager();

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

            beforeAll(async () => {
                const rules = [oneTravelAgentPerFlight];

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                firstTravelAgent = (
                    await EntityManager.createEntity(
                        {
                            firstName: 'Name1',
                            lastName: 'Name1',
                            agentId: '1',
                        },
                        travelAgentEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                secondTravelAgent = (
                    await EntityManager.createEntity(
                        { firstName: 'Name2', lastName: 'Name2', agentId: '2' },
                        travelAgentEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                flight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: new Date().toISOString(),
                            landingDate: new Date().toISOString(),
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                trip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip',
                            destination: 'New York',
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                airport = (
                    await EntityManager.createEntity(
                        {
                            airportName: 'New York Airport',
                            airportId: '1234',
                            country: 'New York',
                        },
                        airportEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
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
                    failures: [
                        {
                            entityId: flight.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: flight.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: firstRelationshipId,
                                            otherEntityId: firstTravelAgent.properties._id,
                                        },
                                    },
                                    properties: [],
                                },
                                {
                                    instance: {
                                        entityId: flight.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: secondTravelAgent.properties._id,
                                        },
                                    },
                                    properties: [],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship', async () => {
                await createRelationshipAndExpectToSucceed(secondTravelAgent, flight, flightsOnRelationshipTemplate, [
                    {
                        ruleId: oneTravelAgentPerFlight._id,
                        failures: [
                            {
                                entityId: flight.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: flight.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: firstRelationshipId,
                                                otherEntityId: firstTravelAgent.properties._id,
                                            },
                                        },
                                        properties: [],
                                    },
                                    {
                                        instance: {
                                            entityId: flight.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: secondTravelAgent.properties._id,
                                            },
                                        },
                                        properties: [],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should fail to create relationship between trip and flight, because dependent in rule', async () => {
                await createRelationshipAndExpectRuleBlock(flight, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: oneTravelAgentPerFlight._id,
                    failures: [
                        {
                            entityId: flight.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: flight.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: trip.properties._id,
                                        },
                                    },
                                    properties: ['name'],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship between trip and flight', async () => {
                await createRelationshipAndExpectToSucceed(flight, trip, tripConnectedToFlightRelationshipTemplate, [
                    {
                        ruleId: oneTravelAgentPerFlight._id,
                        failures: [
                            {
                                entityId: flight.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: flight.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: trip.properties._id,
                                            },
                                        },
                                        properties: ['name'],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should create relationship between airport and flight, because not dependent rule', async () => {
                await createRelationshipAndExpectToSucceed(flight, airport, departureFromRelationshipTemplate);
            });
        });

        describe('Rule 2 - No Overlapping Flights In Trip', () => {
            let trip: IEntity;
            let firstFlight: IEntity;
            let secondFlight: IEntity;
            let thirdFlightOverlapping: IEntity;
            let fourthFlightNotOverlapping: IEntity;
            let fifthFlightOverlapping: IEntity;

            let firstRelationshipId: string;
            let secondRelationshipId: string;

            beforeAll(async () => {
                const rules = [noOverlappingFlightsInTrip];

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip',
                            destination: 'New York',
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                firstFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: '2022-04-01T17:00:00.000Z',
                            landingDate: '2022-04-01T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                secondFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '2',
                            departureDate: '2022-04-20T17:00:00.000Z',
                            landingDate: '2022-04-20T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                thirdFlightOverlapping = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '3',
                            departureDate: '2022-04-01T08:00:00.000Z',
                            landingDate: '2022-04-01T08:30:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                fourthFlightNotOverlapping = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '4',
                            departureDate: '2022-04-29T17:00:00.000Z',
                            landingDate: '2022-04-29T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                fifthFlightOverlapping = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '5',
                            departureDate: '2022-04-20T08:00:00.000Z',
                            landingDate: '2022-04-20T08:30:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${trip.properties._id}" })
                    MATCH (e2 { _id: "${firstFlight.properties._id}" })
                    MATCH (e3 { _id: "${secondFlight.properties._id}" })
                    MATCH (e4 { _id: "${thirdFlightOverlapping.properties._id}" })
                    MATCH (e5 { _id: "${fourthFlightNotOverlapping.properties._id}" })
                    MATCH (e6 { _id: "${fifthFlightOverlapping.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4,e5,e6`,
                    () => {},
                );
            });

            it('Should create a new first relationship', async () => {
                const relationship = await createRelationshipAndExpectToSucceed(firstFlight, trip, tripConnectedToFlightRelationshipTemplate);

                firstRelationshipId = relationship.properties._id;
            });
            it('Should create a new second relationship because not overlapping', async () => {
                const relationship = await createRelationshipAndExpectToSucceed(secondFlight, trip, tripConnectedToFlightRelationshipTemplate);

                secondRelationshipId = relationship.properties._id;
            });

            it('Should fail to create a new relationship of thirdFlight because overlapping', async () => {
                await createRelationshipAndExpectRuleBlock(thirdFlightOverlapping, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: noOverlappingFlightsInTrip._id,
                    failures: [
                        {
                            entityId: trip.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: trip.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: firstRelationshipId,
                                            otherEntityId: firstFlight.properties._id,
                                        },
                                    },
                                    properties: ['_id', 'departureDate'],
                                },
                                {
                                    instance: {
                                        entityId: trip.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: thirdFlightOverlapping.properties._id,
                                        },
                                    },
                                    properties: ['_id', 'departureDate'],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship of thirdFlight', async () => {
                await createRelationshipAndExpectToSucceed(thirdFlightOverlapping, trip, tripConnectedToFlightRelationshipTemplate, [
                    {
                        ruleId: noOverlappingFlightsInTrip._id,
                        failures: [
                            {
                                entityId: trip.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: trip.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: firstRelationshipId,
                                                otherEntityId: firstFlight.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                    {
                                        instance: {
                                            entityId: trip.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: thirdFlightOverlapping.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should create a new fourth relationship because not overlapping', async () => {
                await createRelationshipAndExpectToSucceed(fourthFlightNotOverlapping, trip, tripConnectedToFlightRelationshipTemplate);
            });

            it('Should fail to create a new relationship of fifthFlight because overlapping', async () => {
                await createRelationshipAndExpectRuleBlock(fifthFlightOverlapping, trip, tripConnectedToFlightRelationshipTemplate, {
                    ruleId: noOverlappingFlightsInTrip._id,
                    failures: [
                        {
                            entityId: trip.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: trip.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: secondRelationshipId,
                                            otherEntityId: secondFlight.properties._id,
                                        },
                                    },
                                    properties: ['_id', 'departureDate'],
                                },
                                {
                                    instance: {
                                        entityId: trip.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: fifthFlightOverlapping.properties._id,
                                        },
                                    },
                                    properties: ['_id', 'departureDate'],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship of fifthFlight', async () => {
                await createRelationshipAndExpectToSucceed(fifthFlightOverlapping, trip, tripConnectedToFlightRelationshipTemplate, [
                    {
                        ruleId: noOverlappingFlightsInTrip._id,
                        failures: [
                            {
                                entityId: trip.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: trip.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: secondRelationshipId,
                                                otherEntityId: secondFlight.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                    {
                                        instance: {
                                            entityId: trip.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: fifthFlightOverlapping.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });
        });

        describe('Rule 3 - Warn On Every Flight Departure From Airport With Active Trip', () => {
            let airport: IEntity;
            let firstTrip: IEntity;
            let secondTrip: IEntity;
            let firstFlight: IEntity;
            let secondFlight: IEntity;
            let thirdFlight: IEntity;

            let secondTripConnectedToAirportRelationshipId: string;
            let firstFlightDepartureFromAirportRelationshipId: string;

            beforeAll(async () => {
                const rules = [warnOnEveryFlightDepartureFromAirportWithActiveTrip];

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${airport.properties._id}" })
                    MATCH (e2 { _id: "${firstTrip.properties._id}" })
                    MATCH (e3 { _id: "${secondTrip.properties._id}" })
                    MATCH (e4 { _id: "${firstFlight.properties._id}" })
                    MATCH (e5 { _id: "${secondFlight.properties._id}" })
                    MATCH (e6 { _id: "${thirdFlight.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4,e5,e6`,
                    () => {},
                );
            });

            beforeAll(async () => {
                airport = (
                    await EntityManager.createEntity(
                        {
                            airportName: 'New York Airport',
                            airportId: '1234',
                            country: 'New York',
                        },
                        airportEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                firstTrip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip1',
                            destination: 'New York',
                            startDate: '2022-05-01',
                            endDate: '2022-05-01',
                            active: false,
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                secondTrip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip2',
                            destination: 'New York',
                            startDate: '2022-05-02',
                            endDate: '2022-05-02',
                            active: false,
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                firstFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: '2022-05-01T17:00:00.000Z',
                            landingDate: '2022-05-01T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                secondFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '2',
                            departureDate: '2022-05-02T17:00:00.000Z',
                            landingDate: '2022-05-02T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                thirdFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '3',
                            departureDate: '2022-05-02T17:00:00.000Z',
                            landingDate: '2022-05-02T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
            });

            it('Should create relationship of firstFlight', async () => {
                const firstFlightDepartureFromAirportRelationship = await createRelationshipAndExpectToSucceed(
                    firstFlight,
                    airport,
                    departureFromRelationshipTemplate,
                );
                firstFlightDepartureFromAirportRelationshipId = firstFlightDepartureFromAirportRelationship.properties._id;
            });

            it('Should fail to create relationship of firstTrip because overlaps with firstFlight', async () => {
                await createRelationshipAndExpectRuleBlock(airport, firstTrip, tripConnectedToAirportRelationshipTemplate, {
                    ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                    failures: [
                        {
                            entityId: airport.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: firstFlightDepartureFromAirportRelationshipId,
                                            otherEntityId: firstFlight.properties._id,
                                        },
                                    },
                                    properties: ['departureDate', 'landingDate'],
                                },
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: firstTrip.properties._id,
                                        },
                                    },
                                    properties: ['startDate', 'endDate'],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship of firstTrip', async () => {
                await createRelationshipAndExpectToSucceed(airport, firstTrip, tripConnectedToAirportRelationshipTemplate, [
                    {
                        ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                        failures: [
                            {
                                entityId: airport.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: airport.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: firstFlightDepartureFromAirportRelationshipId,
                                                otherEntityId: firstFlight.properties._id,
                                            },
                                        },
                                        properties: ['departureDate', 'landingDate'],
                                    },
                                    {
                                        instance: {
                                            entityId: airport.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: firstTrip.properties._id,
                                            },
                                        },
                                        properties: ['startDate', 'endDate'],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should create relationship of secondTrip', async () => {
                const secondTripConnectedToAirportRelationship = await createRelationshipAndExpectToSucceed(
                    airport,
                    secondTrip,
                    tripConnectedToAirportRelationshipTemplate,
                );
                secondTripConnectedToAirportRelationshipId = secondTripConnectedToAirportRelationship.properties._id;
            });

            it('Should fail to create relationship of secondFlight because overlaps with secondTrip', async () => {
                await createRelationshipAndExpectRuleBlock(secondFlight, airport, departureFromRelationshipTemplate, {
                    ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                    failures: [
                        {
                            entityId: airport.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: secondFlight.properties._id,
                                        },
                                    },
                                    properties: ['departureDate', 'landingDate'],
                                },
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: secondTripConnectedToAirportRelationshipId,
                                            otherEntityId: secondTrip.properties._id,
                                        },
                                    },
                                    properties: ['startDate', 'endDate'],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and create relationship of secondFlight', async () => {
                await createRelationshipAndExpectToSucceed(secondFlight, airport, departureFromRelationshipTemplate, [
                    {
                        ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                        failures: [
                            {
                                entityId: airport.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: airport.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: config.createdRelationshipIdInBrokenRules,
                                                otherEntityId: secondFlight.properties._id,
                                            },
                                        },
                                        properties: ['departureDate', 'landingDate'],
                                    },
                                    {
                                        instance: {
                                            entityId: airport.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: secondTripConnectedToAirportRelationshipId,
                                                otherEntityId: secondTrip.properties._id,
                                            },
                                        },
                                        properties: ['startDate', 'endDate'],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should fail to create relationship of thirdFlight because overlaps with secondTrip', async () => {
                await createRelationshipAndExpectRuleBlock(thirdFlight, airport, departureFromRelationshipTemplate, {
                    ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                    failures: [
                        {
                            entityId: airport.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: config.createdRelationshipIdInBrokenRules,
                                            otherEntityId: thirdFlight.properties._id,
                                        },
                                    },
                                    properties: ['departureDate', 'landingDate'],
                                },
                                {
                                    instance: {
                                        entityId: airport.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: secondTripConnectedToAirportRelationshipId,
                                            otherEntityId: secondTrip.properties._id,
                                        },
                                    },
                                    properties: ['startDate', 'endDate'],
                                },
                            ],
                        },
                    ],
                });
            }, 500000);
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

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                firstTravelAgent = (
                    await EntityManager.createEntity(
                        {
                            firstName: 'Name1',
                            lastName: 'Name1',
                            agentId: '1',
                        },
                        travelAgentEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                secondTravelAgent = (
                    await EntityManager.createEntity(
                        {
                            firstName: 'Name2',
                            lastName: 'Name2',
                            agentId: '2',
                        },
                        travelAgentEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                thirdTravelAgent = (
                    await EntityManager.createEntity(
                        {
                            firstName: 'Name3',
                            lastName: 'Name3',
                            agentId: '3',
                        },
                        travelAgentEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                flight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: new Date().toISOString(),
                            landingDate: new Date().toISOString(),
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                const firstRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
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
                    [
                        {
                            ruleId: oneTravelAgentPerFlight._id,
                            failures: [
                                {
                                    entityId: flight.properties._id,
                                    causes: [
                                        {
                                            instance: {
                                                entityId: flight.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: firstRelationshipId,
                                                    otherEntityId: firstTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
                                        {
                                            instance: {
                                                entityId: flight.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: secondTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
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
                            failures: [
                                {
                                    entityId: flight.properties._id,
                                    causes: [
                                        {
                                            instance: {
                                                entityId: flight.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: firstRelationshipId,
                                                    otherEntityId: firstTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
                                        {
                                            instance: {
                                                entityId: flight.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: secondRelationshipId,
                                                    otherEntityId: secondTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
                                        {
                                            instance: {
                                                entityId: flight.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: thirdTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
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

            it('Should fail to delete third relationship because still rule fails in a different way', async () => {
                await deleteRelationshipAndExpectRuleBlock(thirdRelationshipId, {
                    ruleId: oneTravelAgentPerFlight._id,
                    failures: [
                        {
                            entityId: flight.properties._id,
                            causes: [
                                {
                                    instance: {
                                        entityId: flight.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: firstRelationshipId,
                                            otherEntityId: firstTravelAgent.properties._id,
                                        },
                                    },
                                    properties: [],
                                },
                                {
                                    instance: {
                                        entityId: flight.properties._id,
                                        aggregatedRelationship: {
                                            relationshipId: secondRelationshipId,
                                            otherEntityId: secondTravelAgent.properties._id,
                                        },
                                    },
                                    properties: [],
                                },
                            ],
                        },
                    ],
                });
            });

            it('Should ignore failed rule and delete third relationship', async () => {
                await deleteRelationshipAndExpectToSucceed(thirdRelationshipId, flightsOnRelationshipTemplate._id, thirdTravelAgent, flight, [
                    {
                        ruleId: oneTravelAgentPerFlight._id,
                        failures: [
                            {
                                entityId: flight.properties._id,
                                causes: [
                                    {
                                        instance: {
                                            entityId: flight.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: firstRelationshipId,
                                                otherEntityId: firstTravelAgent.properties._id,
                                            },
                                        },
                                        properties: [],
                                    },
                                    {
                                        instance: {
                                            entityId: flight.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: secondRelationshipId,
                                                otherEntityId: secondTravelAgent.properties._id,
                                            },
                                        },
                                        properties: [],
                                    },
                                ],
                            },
                        ],
                    },
                ]);
            });

            it('Should delete second relationship because rule passes', async () => {
                await deleteRelationshipAndExpectToSucceed(secondRelationshipId, flightsOnRelationshipTemplate._id, secondTravelAgent, flight);
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

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            beforeAll(async () => {
                trip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip',
                            destination: 'New York',
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                firstFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: '2022-04-01T17:00:00.000Z',
                            landingDate: '2022-04-01T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                secondFlightNotOverlapping = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '2',
                            departureDate: '2022-04-20T17:00:00.000Z',
                            landingDate: '2022-04-20T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                thirdFlightOverlapping = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '3',
                            departureDate: '2022-04-01T08:00:00.000Z',
                            landingDate: '2022-04-01T08:30:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                const firstRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToFlightRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
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
                    neo4j.mockUserId,
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
                            failures: [
                                {
                                    entityId: trip.properties._id,
                                    causes: [
                                        {
                                            instance: {
                                                entityId: trip.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: firstRelationshipId,
                                                    otherEntityId: firstFlight.properties._id,
                                                },
                                            },
                                            properties: ['_id', 'departureDate'],
                                        },
                                        {
                                            instance: {
                                                entityId: trip.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: thirdFlightOverlapping.properties._id,
                                                },
                                            },
                                            properties: ['_id', 'departureDate'],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
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

            it('Should delete second relationship because not related to existing overlapping', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    secondRelationshipId,
                    tripConnectedToFlightRelationshipTemplate._id,
                    secondFlightNotOverlapping,
                    trip,
                    [],
                );
            });
            it('Should delete third relationship because removes the overlapping', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    thirdRelationshipId,
                    tripConnectedToFlightRelationshipTemplate._id,
                    thirdFlightOverlapping,
                    trip,
                    [],
                );
            });
        });

        describe('Rule 3 - Warn On Every Flight Departure From Airport With Active Trip', () => {
            let airport: IEntity;
            let firstTrip: IEntity;
            let secondTrip: IEntity;
            let firstFlight: IEntity;
            let secondFlight: IEntity;

            let firstTripConnectedToAirportRelationshipId: string;
            let secondFlightDepartureFromAirportRelationshipId: string;

            beforeAll(async () => {
                const rules = [warnOnEveryFlightDepartureFromAirportWithActiveTrip];

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${airport.properties._id}" })
                    MATCH (e2 { _id: "${firstTrip.properties._id}" })
                    MATCH (e3 { _id: "${secondTrip.properties._id}" })
                    MATCH (e4 { _id: "${firstFlight.properties._id}" })
                    MATCH (e5 { _id: "${secondFlight.properties._id}" })
                    DETACH DELETE e1,e2,e3,e4,e5`,
                    () => {},
                );
            });

            beforeAll(async () => {
                airport = (
                    await EntityManager.createEntity(
                        {
                            airportName: 'New York Airport',
                            airportId: '1234',
                            country: 'New York',
                        },
                        airportEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                firstTrip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip1',
                            destination: 'New York',
                            startDate: '2022-05-01',
                            endDate: '2022-05-01',
                            active: false,
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                secondTrip = (
                    await EntityManager.createEntity(
                        {
                            name: 'My trip2',
                            destination: 'New York',
                            startDate: '2022-05-02',
                            endDate: '2022-05-02',
                            active: false,
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                firstFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '1',
                            departureDate: '2022-05-01T17:00:00.000Z',
                            landingDate: '2022-05-01T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;
                secondFlight = (
                    await EntityManager.createEntity(
                        {
                            flightNumber: '2',
                            departureDate: '2022-05-02T17:00:00.000Z',
                            landingDate: '2022-05-02T19:00:00.000Z',
                        },
                        flightEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    )
                ).createdEntity;

                const firstTripConnectedToAirportRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToAirportRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: airport.properties._id,
                        destinationEntityId: firstTrip.properties._id,
                    },
                    tripConnectedToAirportRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
                firstTripConnectedToAirportRelationshipId = firstTripConnectedToAirportRelationship.properties._id;

                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: departureFromRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: airport.properties._id,
                    },
                    departureFromRelationshipTemplate,
                    [
                        {
                            ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                            failures: [
                                {
                                    entityId: airport.properties._id,
                                    causes: [
                                        {
                                            instance: {
                                                entityId: airport.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: firstFlight.properties._id,
                                                },
                                            },
                                            properties: ['departureDate', 'landingDate'],
                                        },
                                        {
                                            instance: {
                                                entityId: airport.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: firstTripConnectedToAirportRelationshipId,
                                                    otherEntityId: firstTrip.properties._id,
                                                },
                                            },
                                            properties: ['startDate', 'endDate'],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
                );

                const secondFlightDepartureFromAirportRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: departureFromRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondFlight.properties._id,
                        destinationEntityId: airport.properties._id,
                    },
                    departureFromRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
                secondFlightDepartureFromAirportRelationshipId = secondFlightDepartureFromAirportRelationship.properties._id;

                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToAirportRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: airport.properties._id,
                        destinationEntityId: secondTrip.properties._id,
                    },
                    tripConnectedToAirportRelationshipTemplate,
                    [
                        {
                            ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                            failures: [
                                {
                                    entityId: airport.properties._id,
                                    causes: [
                                        {
                                            instance: {
                                                entityId: airport.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: secondFlightDepartureFromAirportRelationshipId,
                                                    otherEntityId: secondFlight.properties._id,
                                                },
                                            },
                                            properties: ['departureDate', 'landingDate'],
                                        },
                                        {
                                            instance: {
                                                entityId: airport.properties._id,
                                                aggregatedRelationship: {
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: secondTrip.properties._id,
                                                },
                                            },
                                            properties: ['startDate', 'endDate'],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
                );
            }, 500000);

            it('Should delete firstTrip relationship because only old causes exist', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    firstTripConnectedToAirportRelationshipId,
                    tripConnectedToAirportRelationshipTemplate._id,
                    airport,
                    firstTrip,
                );
            });

            it('Should delete secondFlight relationship because now no overlapping exist', async () => {
                await deleteRelationshipAndExpectToSucceed(
                    secondFlightDepartureFromAirportRelationshipId,
                    departureFromRelationshipTemplate._id,
                    secondFlight,
                    airport,
                );
            });
        });
    });
});
