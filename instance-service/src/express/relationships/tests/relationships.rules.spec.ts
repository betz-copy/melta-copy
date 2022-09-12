import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Neo4jClient from '../../../utils/neo4j';
import { IEntity, IMongoEntityTemplate } from '../../entities/interface';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../interface';
import { IMongoRelationshipTemplateRule } from '../../rules/interfaces';
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

const flightsOnRelationshipTemplatePopulated: IMongoRelationshipTemplatePopulated = {
    _id: '111',
    name: 'flies on',
    displayName: 'flies on',
    sourceEntity: travelAgentEntityTemplate,
    destinationEntity: flightEntityTemplate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: flightsOnRelationshipTemplatePopulated._id,
    name: flightsOnRelationshipTemplatePopulated.name,
    displayName: flightsOnRelationshipTemplatePopulated.displayName,
    sourceEntityId: flightsOnRelationshipTemplatePopulated.sourceEntity._id,
    destinationEntityId: flightsOnRelationshipTemplatePopulated.destinationEntity._id,
    createdAt: flightsOnRelationshipTemplatePopulated.createdAt,
    updatedAt: flightsOnRelationshipTemplatePopulated.updatedAt,
};

// rule 1
export const oneTravelAgentPerFlight: IMongoRelationshipTemplateRule = {
    _id: '12345',
    name: 'One travel agent per flight',
    description: 'One travel agent per flight',
    actionOnFail: 'WARNING',
    relationshipTemplateId: flightsOnRelationshipTemplatePopulated._id,
    pinnedEntityTemplateId: flightEntityTemplate._id,
    unpinnedEntityTemplateId: travelAgentEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
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

        describe('One travel agent per flight', () => {
            let firstRelationshipId: string;

            beforeAll(async () => {
                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [flightEntityTemplate._id],
                }).reply(200, [oneTravelAgentPerFlight]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    pinnedEntityTemplateIds: [travelAgentEntityTemplate._id],
                }).reply(200, [oneTravelAgentPerFlight]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                    disabled: false,
                    relationshipTemplateIds: [flightsOnRelationshipTemplate._id],
                }).reply(200, [oneTravelAgentPerFlight]);

                mock.onGet(`${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${flightsOnRelationshipTemplate._id}`).reply(
                    200,
                    flightsOnRelationshipTemplate,
                );

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    sourceEntityIds: [travelAgentEntityTemplate._id],
                }).reply(200, [flightsOnRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [flightEntityTemplate._id],
                }).reply(200, [flightsOnRelationshipTemplate]);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    sourceEntityIds: [flightEntityTemplate._id],
                }).reply(200, []);

                mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
                    destinationEntityIds: [travelAgentEntityTemplate._id],
                }).reply(200, []);

                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${flightEntityTemplate._id}`).reply(200, flightEntityTemplate);
                mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${travelAgentEntityTemplate._id}`).reply(
                    200,
                    travelAgentEntityTemplate,
                );
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
            });

            afterAll(async () => {
                await EntityManager.deleteByTemplateId(flightEntityTemplate._id);
                await EntityManager.deleteByTemplateId(travelAgentEntityTemplate._id);

                await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${flightsOnRelationshipTemplatePopulated._id}\`]-() DELETE r `, () => {});
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
            });
        });
    });
});
