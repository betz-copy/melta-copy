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
            active: {
                type: 'boolean',
                title: 'פעיל',
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
    _id: '111',
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

// todo: rule 2 (need to support _id in formula)

// rule 3
// const warnOnEveryFlightOnActiveZone: IMongoRule = {
//     _id: '333',
//     name: 'התראה על טיסות בסבב פעיל',
//     description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
//     actionOnFail: 'WARNING',
//     relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
//     pinnedEntityTemplateId: tripEntityTemplate._id,
//     unpinnedEntityTemplateId: flightEntityTemplate._id,
//     disabled: false,
//     formula: {
//         isGroup: true,
//         ruleOfGroup: 'AND',
//         subFormulas: [
//             {
//                 isEquation: true,
//                 operatorBool: 'equals',
//                 lhsArgument: { isPropertyOfVariable: true, variableName: tripEntityTemplate._id, property: 'active' },
//                 rhsArgument: { isConstant: true, value: false },
//             },
//         ],
//     },
// };

const mockEntityTemplatesRoutes = (mock: MockAdapter, entityTemplates: IMongoEntityTemplate[]) => {
    entityTemplates.forEach((entityTemplate) => {
        mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${entityTemplate._id}`).reply(200, entityTemplate);
    });
};

const mockRelationshipTemplatesRoutes = (
    mock: MockAdapter,
    entityTemplates: IMongoEntityTemplate[],
    relationshipTemplates: IMongoRelationshipTemplate[],
) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        mock.onGet(`${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${relationshipTemplate._id}`).reply(
            200,
            relationshipTemplate,
        );
    });

    entityTemplates.forEach((entityTemplate) => {
        const relationshipTemplatesBySource = relationshipTemplates.filter(({ sourceEntityId }) => sourceEntityId === entityTemplate._id);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
            sourceEntityIds: [entityTemplate._id],
        }).reply(200, relationshipTemplatesBySource);
    });

    entityTemplates.forEach((entityTemplate) => {
        const relationshipTemplatesByDestination = relationshipTemplates.filter(
            ({ destinationEntityId }) => destinationEntityId === entityTemplate._id,
        );

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
            destinationEntityIds: [entityTemplate._id],
        }).reply(200, relationshipTemplatesByDestination);
    });
};

const mockRulesRoutes = (
    mock: MockAdapter,
    entityTemplates: IMongoEntityTemplate[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    rules: IMongoRule[],
) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        const rulesByRelationshipId = rules.filter(({ relationshipTemplateId }) => relationshipTemplate._id === relationshipTemplateId);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
            disabled: false,
            relationshipTemplateIds: [relationshipTemplate._id],
        }).reply(200, rulesByRelationshipId);
    });

    entityTemplates.forEach((entityTemplate) => {
        const rulesByPinnedEntityTemplate = rules.filter(({ pinnedEntityTemplateId }) => entityTemplate._id === pinnedEntityTemplateId);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
            disabled: false,
            pinnedEntityTemplateIds: [entityTemplate._id],
        }).reply(200, rulesByPinnedEntityTemplate);
    });
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
                const entityTemplates = [flightEntityTemplate, travelAgentEntityTemplate, tripEntityTemplate, airportEntityTemplate];
                const relationshipTemplates = [
                    flightsOnRelationshipTemplate,
                    tripConnectedToFlightRelationshipTemplate,
                    departureFromRelationshipTemplate,
                ];
                const rules = [oneTravelAgentPerFlight];

                mockRulesRoutes(mock, entityTemplates, relationshipTemplates, rules);
                mockRelationshipTemplatesRoutes(mock, entityTemplates, relationshipTemplates);
                mockEntityTemplatesRoutes(mock, entityTemplates);
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
