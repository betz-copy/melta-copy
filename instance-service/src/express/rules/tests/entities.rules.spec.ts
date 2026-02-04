import { IPropertyValue } from '@microservices/shared';
import config from '../../../config';
import { IMongoEntityTemplate } from '../../../externalServices/templates/interfaces/entityTemplates';
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
import { addStringFieldsAndNormalizeDateValues } from '../../entities/validator.template';
import { BadRequestError } from '../../error';
import RelationshipManager from '../../relationships/manager';
import { IBrokenRule } from '../interfaces';
import { sortBrokenRules } from '../throwIfActionCausedRuleFailures';

const { neo4j } = config;

const {
    allEntityTemplateIds,
    allEntityTemplates,
    allRelationshipTemplates,
    airportEntityTemplate,
    flightEntityTemplate,
    departureFromRelationshipTemplate,
    flightsOnRelationshipTemplate,
    noOverlappingFlightsInTrip,
    oneTravelAgentPerFlight,
    travelAgentEntityTemplate,
    tripConnectedToAirportRelationshipTemplate,
    tripConnectedToFlightRelationshipTemplate,
    tripEntityTemplate,
    warnOnEveryFlightDepartureFromAirportWithActiveTrip,
    startDateSmallerThenEndDateInTrip,
} = generateTemplates();

const updateEntityAndExpectRuleBlock = async (
    entityId: string,
    entityProperties: Record<string, IPropertyValue>,
    entityTemplate: IMongoEntityTemplate,
    brokenRule: IBrokenRule,
) => {
    const { err } = await trycatch(() =>
        EntityManager.updateEntityById(
            entityId,
            addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate),
            entityTemplate,
            [],
            neo4j.mockUserId,
        ),
    );

    expect(err).toStrictEqual(
        new BadRequestError('[NEO4J] action is blocked by rules.', {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules: expect.any(Array),
        }),
    );
    // biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
    expect(sortBrokenRules((err as any).metadata.brokenRules)).toStrictEqual(sortBrokenRules([brokenRule]));
};

const updateEntityAndExpectToSucceed = async (
    entityId: string,
    entityProperties: Record<string, IPropertyValue>,
    entityTemplate: IMongoEntityTemplate,
    ignoredRules: IBrokenRule[] = [],
) => {
    const updatedEntity = await EntityManager.updateEntityById(
        entityId,
        addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate),
        entityTemplate,
        ignoredRules,
        neo4j.mockUserId,
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
    const mockTemplateManager = getMockAdapterTemplateManager();

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

                await RelationshipManager.createRelationshipByEntityIds(
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
                                                    relationshipId: config.createdRelationshipIdInBrokenRules,
                                                    otherEntityId: secondTravelAgent.properties._id,
                                                },
                                            },
                                            properties: [],
                                        },
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
                                    ],
                                },
                            ],
                        },
                    ],
                    neo4j.mockUserId,
                );
            });

            afterAll(async () => {
                await Neo4jClient.writeTransaction(
                    `MATCH (e1 { _id: "${firstTravelAgent.properties._id}" })
                    MATCH (e2 { _id: "${secondTravelAgent.properties._id}" })
                    MATCH (e3 { _id: "${flight.properties._id}" })
                    DETACH DELETE e1,e2,e3`,
                    () => {},
                );
            });

            it('Should edit travelAgent age, because not dependent in rule', async () => {
                await updateEntityAndExpectToSucceed(
                    firstTravelAgent.properties._id,
                    {
                        ...firstTravelAgent.properties,
                        firstName: 'UpdatedName1',
                    },
                    travelAgentEntityTemplate,
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
                            departureDate: '2022-04-02T17:00:00.000Z',
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
                            departureDate: '2022-04-03T08:00:00.000Z',
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
                        sourceEntityId: secondFlight.properties._id,
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
                        sourceEntityId: thirdFlight.properties._id,
                        destinationEntityId: trip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
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
                                                relationshipId: thirdRelationshipId,
                                                otherEntityId: thirdFlight.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                ],
                            },
                        ],
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
                                                    relationshipId: thirdRelationshipId,
                                                    otherEntityId: thirdFlight.properties._id,
                                                },
                                            },
                                            properties: ['_id', 'departureDate'],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                );
            });

            it('Should update second flight date to untaken, because not related to old broken rule that still fails', async () => {
                await updateEntityAndExpectToSucceed(
                    secondFlight.properties._id,
                    {
                        ...secondFlight.properties,
                        departureDate: '2022-04-04T08:00:00.000Z',
                    },
                    flightEntityTemplate,
                    [],
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
                                                relationshipId: thirdRelationshipId,
                                                otherEntityId: thirdFlight.properties._id,
                                            },
                                        },
                                        properties: ['_id', 'departureDate'],
                                    },
                                ],
                            },
                        ],
                    },
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
            let secondTripConnectedToAirportRelationshipId: string;
            let firstFlightDepartureFromAirportRelationshipId: string;
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
                            departureDate: '2022-04-02T17:00:00.000Z',
                            landingDate: '2022-04-02T19:00:00.000Z',
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

                const firstFlightDepartureFromAirportRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: departureFromRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstFlight.properties._id,
                        destinationEntityId: airport.properties._id,
                    },
                    departureFromRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
                firstFlightDepartureFromAirportRelationshipId = firstFlightDepartureFromAirportRelationship.properties._id;

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

                const secondTripConnectedToAirportRelationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: tripConnectedToAirportRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: airport.properties._id,
                        destinationEntityId: secondTrip.properties._id,
                    },
                    tripConnectedToFlightRelationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
                secondTripConnectedToAirportRelationshipId = secondTripConnectedToAirportRelationship.properties._id;
            });

            it('Should fail to update first flight date because will overlap with first trip', async () => {
                await updateEntityAndExpectRuleBlock(
                    firstFlight.properties._id,
                    {
                        ...firstFlight.properties,
                        departureDate: '2022-05-01T17:00:00.000Z',
                        landingDate: '2022-05-01T19:00:00.000Z',
                    },
                    flightEntityTemplate,
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
                );
            });
            it('Should ignore failed rule and update first flight date', async () => {
                await updateEntityAndExpectToSucceed(
                    firstFlight.properties._id,
                    {
                        ...firstFlight.properties,
                        departureDate: '2022-05-01T17:00:00.000Z',
                        landingDate: '2022-05-01T19:00:00.000Z',
                    },
                    flightEntityTemplate,
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
                );
            });
            it('Should fail to update second flight date because will overlap with second trip', async () => {
                await updateEntityAndExpectRuleBlock(
                    secondFlight.properties._id,
                    {
                        ...secondFlight.properties,
                        departureDate: '2022-05-02T17:00:00.000Z',
                        landingDate: '2022-05-02T19:00:00.000Z',
                    },
                    flightEntityTemplate,
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
                );
            });
            it('Should ignore failed rule and update second flight date', async () => {
                await updateEntityAndExpectToSucceed(
                    secondFlight.properties._id,
                    {
                        ...secondFlight.properties,
                        departureDate: '2022-05-02T17:00:00.000Z',
                        landingDate: '2022-05-02T19:00:00.000Z',
                    },
                    flightEntityTemplate,
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
                    ],
                );
            });
            it('Should fail to update first flight date because still overlaps with first trip', async () => {
                await updateEntityAndExpectRuleBlock(
                    firstFlight.properties._id,
                    {
                        ...firstFlight.properties,
                        departureDate: '2022-05-01T15:00:00.000Z', // same overlapping date, but different hour
                        landingDate: '2022-05-01T19:00:00.000Z',
                    },
                    flightEntityTemplate,
                    {
                        ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                        failures: [
                            {
                                entityId: airport.properties._id,
                                // todo: this outcome is slightly unintuitive. you cant see against which trip you failed
                                causes: [
                                    {
                                        instance: {
                                            entityId: airport.properties._id,
                                            aggregatedRelationship: {
                                                relationshipId: firstFlightDepartureFromAirportRelationshipId,
                                                otherEntityId: firstFlight.properties._id,
                                            },
                                        },
                                        properties: ['departureDate'],
                                    },
                                ],
                            },
                        ],
                    },
                );
            });
            it('Should fail to update first flight date because overlaps with first trip and second trip', async () => {
                await updateEntityAndExpectRuleBlock(
                    firstFlight.properties._id,
                    {
                        ...firstFlight.properties,
                        departureDate: '2022-05-01T17:00:00.000Z',
                        landingDate: '2022-05-02T19:00:00.000Z', // now overlaps with second trip too
                    },
                    flightEntityTemplate,
                    {
                        ruleId: warnOnEveryFlightDepartureFromAirportWithActiveTrip._id,
                        failures: [
                            {
                                entityId: airport.properties._id,
                                // todo: this outcome is slightly unintuitive...
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
                );
            });
        });
    });

    describe('Create entity', () => {
        describe('Rule 4 - Start Date Smaller Then End Date In Trip', () => {
            beforeAll(async () => {
                const rules = [startDateSmallerThenEndDateInTrip];

                mockRulesRoutes(mockTemplateManager, rules, allEntityTemplateIds);
                mockRelationshipTemplatesRoutes(mockTemplateManager, allRelationshipTemplates);
                mockEntityTemplatesRoutes(mockTemplateManager, allEntityTemplates);
            });

            it('Should create trip with startDate <= endDate', async () => {
                const tripProperties = {
                    name: 'My trip',
                    destination: 'New York',
                    active: false,
                    startDate: '2022-05-01',
                    endDate: '2022-05-05',
                };
                const trip = await EntityManager.createEntity(tripProperties, tripEntityTemplate, [], neo4j.mockUserId);

                expect(trip).toStrictEqual({
                    templateId: tripEntityTemplate._id,
                    properties: {
                        ...tripProperties,
                        _id: expect.any(String),
                        disabled: expect.any(Boolean),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    },
                });
            });

            it('Should fail to create trip with startDate > endDate', async () => {
                const { err } = await trycatch(() =>
                    EntityManager.createEntity(
                        {
                            name: 'My trip',
                            destination: 'New York',
                            active: false,
                            startDate: '2022-05-05',
                            endDate: '2022-05-01',
                        },
                        tripEntityTemplate,
                        [],
                        neo4j.mockUserId,
                    ),
                );

                expect(err).toStrictEqual(
                    new BadRequestError('[NEO4J] action is blocked by rules.', {
                        errorCode: config.errorCodes.ruleBlock,
                        brokenRules: {
                            ruleId: startDateSmallerThenEndDateInTrip._id,
                            failures: [{ entityId: config.createdEntityIdInBrokenRules, causes: [] }],
                        },
                    }),
                );
            }, 500000);
        });
    });
});
