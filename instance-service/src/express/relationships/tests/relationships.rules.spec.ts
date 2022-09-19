import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Neo4jClient from '../../../utils/neo4j';
import { IEntity, IMongoEntityTemplate } from '../../entities/interface';
import { IMongoRelationshipTemplate } from '../interface';
import { IMongoRule } from '../../rules/interfaces';
import { ServiceError } from '../../error';
import EntityManager from '../../entities/manager';
import RelationshipManager from '../manager';
import config from '../../../config';

const { relationshipManager, templateManager, neo4j } = config;

const travelAgentEntityTemplate: IMongoEntityTemplate = {
    _id: '111',
    name: 'travelAgent',
    displayName: 'Travel agent',
    category: '111',
    properties: {
        type: 'object',
        properties: {
            firstName: {
                type: 'string',
                title: 'First name',
            },
            lastName: {
                type: 'string',
                title: 'Last name',
            },
            age: {
                type: 'number',
                title: 'Age',
            },
            gender: {
                type: 'boolean',
                title: 'Gender',
            },
            agentId: {
                type: 'string',
                title: 'Agent id',
            },
        },
        required: ['firstName', 'lastName', 'agentId'],
    },
    propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
    propertiesPreview: ['firstName', 'lastName', 'age'],
    disabled: false,
};

const flightEntityTemplate: IMongoEntityTemplate = {
    _id: '222',
    name: 'flight',
    displayName: 'flight',
    category: '222',
    properties: {
        type: 'object',
        properties: {
            flightNumber: {
                type: 'string',
                title: 'Flight number',
            },
            departureDate: {
                type: 'string',
                title: 'Departure date',
                format: 'date-time',
            },
            landingDate: {
                type: 'string',
                title: 'Landing date',
                format: 'date-time',
            },
            from: {
                type: 'string',
                title: 'Departure location',
            },
            to: {
                type: 'string',
                title: 'Arrival location',
            },
            planeType: {
                type: 'string',
                title: 'Plane type',
            },
        },
        required: ['flightNumber', 'departureDate', 'landingDate'],
    },
    propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
    propertiesPreview: ['flightNumber', 'from', 'to'],
    disabled: false,
};

const tripEntityTemplate: IMongoEntityTemplate = {
    _id: '333',
    name: 'trip',
    displayName: 'טיול',
    category: '333',
    properties: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'שם',
            },
            destination: {
                type: 'string',
                title: 'יעד',
            },
            startDate: {
                type: 'string',
                title: 'תאריך התחלה',
                format: 'date',
            },
            endDate: {
                type: 'string',
                title: 'תאריך סיום',
                format: 'date',
            },
            firstFile: {
                type: 'string',
                title: 'קובץ ראשון',
                format: 'fileId',
            },
        },
        required: ['name', 'destination'],
    },
    propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
    propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
    disabled: false,
};

const airportEntityTemplate: IMongoEntityTemplate = {
    _id: '444',
    name: 'airport',
    displayName: 'שדה תעופה',
    disabled: false,
    category: '444',
    properties: {
        type: 'object',
        properties: {
            airportName: {
                type: 'string',
                title: 'שם',
            },
            airportId: {
                type: 'string',
                title: 'מזהה',
            },
            country: {
                type: 'string',
                title: 'מדינה',
            },
        },
        required: ['airportName', 'airportId', 'country'],
    },
    propertiesOrder: ['airportName', 'airportId', 'country'],
    propertiesPreview: ['airportName', 'country'],
};

const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '111',
    name: 'flies on',
    displayName: 'flies on',
    sourceEntityId: travelAgentEntityTemplate._id,
    destinationEntityId: flightEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const tripConnectedToFlightRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '222',
    name: 'flightInTrip',
    displayName: 'טיסה משוייכת לטיול',
    sourceEntityId: flightEntityTemplate._id,
    destinationEntityId: tripEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const departureFromRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '333',
    name: 'departueFrom',
    displayName: 'ממריא מ',
    sourceEntityId: flightEntityTemplate._id,
    destinationEntityId: airportEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// rule 1
export const oneTravelAgentPerFlight: IMongoRule = {
    _id: '12345',
    name: 'One travel agent per flight',
    description: 'One travel agent per flight',
    actionOnFail: 'WARNING',
    relationshipTemplateId: flightsOnRelationshipTemplate._id,
    pinnedEntityTemplateId: flightEntityTemplate._id,
    unpinnedEntityTemplateId: travelAgentEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'OR',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'lessThanOrEqual',
                lhsArgument: {
                    isCountAggFunction: true,
                    variableName: `${flightEntityTemplate._id}.${flightsOnRelationshipTemplate._id}.${travelAgentEntityTemplate._id}`,
                },
                rhsArgument: { isConstant: true, value: 1 },
            },
            // just for tests - to be dependent on tripConnectedToFlight
            {
                isAggregationGroup: true,
                aggregation: 'EVERY',
                ruleOfGroup: 'AND',
                variableNameOfAggregation: `${flightEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${tripEntityTemplate._id}`,
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'equals',
                        lhsArgument: {
                            isPropertyOfVariable: true,
                            variableName: `${flightEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${tripEntityTemplate._id}`,
                            property: 'name',
                        },
                        rhsArgument: {
                            isConstant: true,
                            value: 'debug',
                        },
                    },
                ],
            },
        ],
    },
};

describe('Relationship manager', () => {
    const mock = new MockAdapter(axios);

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    describe('Create relationship', () => {
        let firstTravelAgent: IEntity;
        let secondTravelAgent: IEntity;
        let flight: IEntity;
        let trip: IEntity;
        let airport: IEntity;

        describe('One travel agent per flight', () => {
            let firstRelationshipId: string;
            let secondRelationshipId: string;

            beforeAll(async () => {
                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [flightEntityTemplate._id],
                }).reply(200, [oneTravelAgentPerFlight]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [travelAgentEntityTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [tripEntityTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [airportEntityTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    relationshipTemplateIds: [flightsOnRelationshipTemplate._id],
                }).reply(200, [oneTravelAgentPerFlight]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    relationshipTemplateIds: [tripConnectedToFlightRelationshipTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    relationshipTemplateIds: [departureFromRelationshipTemplate._id],
                }).reply(200, []);

                mock.onGet(`${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${flightsOnRelationshipTemplate._id}`).reply(
                    200,
                    flightsOnRelationshipTemplate,
                );
                mock.onGet(
                    `${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${tripConnectedToFlightRelationshipTemplate._id}`,
                ).reply(200, flightsOnRelationshipTemplate);

                mock.onGet(
                    `${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${departureFromRelationshipTemplate._id}`,
                ).reply(200, departureFromRelationshipTemplate);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    sourceEntityIds: [travelAgentEntityTemplate._id],
                }).reply(200, [flightsOnRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [flightEntityTemplate._id],
                }).reply(200, [flightsOnRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    sourceEntityIds: [flightEntityTemplate._id],
                }).reply(200, [tripConnectedToFlightRelationshipTemplate, departureFromRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [travelAgentEntityTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [tripEntityTemplate._id],
                }).reply(200, [tripConnectedToFlightRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [airportEntityTemplate._id],
                }).reply(200, [departureFromRelationshipTemplate]);

                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${flightEntityTemplate._id}`).reply(200, flightEntityTemplate);
                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${travelAgentEntityTemplate._id}`).reply(
                    200,
                    travelAgentEntityTemplate,
                );
                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${tripEntityTemplate._id}`).reply(200, tripEntityTemplate);
                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${airportEntityTemplate._id}`).reply(200, airportEntityTemplate);
            });

            beforeAll(async () => {
                firstTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name1',
                        lastName: 'Name1',
                        age: 1,
                        gender: true,
                        agentId: '1',
                    },
                });

                secondTravelAgent = await EntityManager.createEntity({
                    templateId: travelAgentEntityTemplate._id,
                    properties: {
                        firstName: 'Name2',
                        lastName: 'Name2',
                        age: 2,
                        gender: true,
                        agentId: '2',
                    },
                });

                flight = await EntityManager.createEntity({
                    templateId: flightEntityTemplate._id,
                    properties: {
                        flightNumber: '1',
                        departureDate: new Date().toISOString(),
                        landingDate: new Date().toISOString(),
                        from: 'Paris',
                        to: 'New York',
                        planeType: 'Boeing 747',
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
                await EntityManager.deleteByTemplateId(flightEntityTemplate._id);
                await EntityManager.deleteByTemplateId(travelAgentEntityTemplate._id);
                await EntityManager.deleteByTemplateId(tripEntityTemplate._id);

                await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${flightsOnRelationshipTemplate._id}\`]-() DELETE r `, () => {});
            });

            it('Should create a new relationship', async () => {
                const relationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: firstTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [],
                );

                expect(relationship.templateId).toStrictEqual(flightsOnRelationshipTemplate._id);
                expect(relationship.sourceEntityId).toStrictEqual(firstTravelAgent.properties._id);
                expect(relationship.destinationEntityId).toStrictEqual(flight.properties._id);

                firstRelationshipId = relationship.properties._id;
            });

            it('Should fail to create a new relationship because one already exists', async () => {
                try {
                    await RelationshipManager.createRelationshipByEntityIds(
                        {
                            templateId: flightsOnRelationshipTemplate._id,
                            properties: { testProp: 'testProp' },
                            sourceEntityId: secondTravelAgent.properties._id,
                            destinationEntityId: flight.properties._id,
                        },
                        flightsOnRelationshipTemplate,
                        [],
                    );
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError);
                    expect((error as ServiceError).message).toStrictEqual(`[NEO4J] relationship creation is blocked by rules.`);
                    expect((error as ServiceError).metadata).toStrictEqual({
                        errorCode: config.errorCodes.ruleBlock,
                        brokenRules: expect.arrayContaining([
                            {
                                relationshipIds: expect.arrayContaining([config.createdRelationshipIdInBrokenRules, firstRelationshipId]),
                                ruleId: oneTravelAgentPerFlight._id,
                            },
                        ]),
                    });
                }
            });

            it('Should ignore failed rule and create relationship', async () => {
                const relationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: flightsOnRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: secondTravelAgent.properties._id,
                        destinationEntityId: flight.properties._id,
                    },
                    flightsOnRelationshipTemplate,
                    [
                        {
                            relationshipIds: [config.createdRelationshipIdInBrokenRules, firstRelationshipId],
                            ruleId: oneTravelAgentPerFlight._id,
                        },
                    ],
                );

                expect(relationship.templateId).toStrictEqual(flightsOnRelationshipTemplate._id);
                expect(relationship.sourceEntityId).toStrictEqual(secondTravelAgent.properties._id);
                expect(relationship.destinationEntityId).toStrictEqual(flight.properties._id);

                secondRelationshipId = relationship.properties._id;
            });

            it('Should fail to create relationship between trip and flight, because rule dependent ', async () => {
                try {
                    await RelationshipManager.createRelationshipByEntityIds(
                        {
                            templateId: tripConnectedToFlightRelationshipTemplate._id,
                            properties: { testProp: 'testProp' },
                            sourceEntityId: flight.properties._id,
                            destinationEntityId: trip.properties._id,
                        },
                        tripConnectedToFlightRelationshipTemplate,
                        [],
                    );
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError);
                    expect((error as ServiceError).message).toStrictEqual(`[NEO4J] relationship creation is blocked by rules.`);
                    expect((error as ServiceError).metadata).toStrictEqual({
                        errorCode: config.errorCodes.ruleBlock,
                        brokenRules: expect.arrayContaining([
                            {
                                relationshipIds: expect.arrayContaining([firstRelationshipId, secondRelationshipId]),
                                ruleId: oneTravelAgentPerFlight._id,
                            },
                        ]),
                    });
                }
            });

            it('Should create relationship between airport and flight, because rule not dependent', async () => {
                const relationship = await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: departureFromRelationshipTemplate._id,
                        properties: { testProp: 'testProp' },
                        sourceEntityId: flight.properties._id,
                        destinationEntityId: airport.properties._id,
                    },
                    departureFromRelationshipTemplate,
                    [],
                );

                expect(relationship.templateId).toStrictEqual(departureFromRelationshipTemplate._id);
                expect(relationship.sourceEntityId).toStrictEqual(flight.properties._id);
                expect(relationship.destinationEntityId).toStrictEqual(airport.properties._id);
            });
        });
    });
});
