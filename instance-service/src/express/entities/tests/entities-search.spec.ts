import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config';
import { IMongoEntityTemplate } from '../../../externalServices/templates/interfaces/entityTemplates';
import { getMockAdapterTemplateManager } from '../../../externalServices/tests/axios.mock';
import {
    generateTemplates,
    mockEntityTemplatesRoutes,
    mockRelationshipTemplatesRoutes,
    mockRulesRoutes,
} from '../../../externalServices/tests/externalServices.mock';
import Neo4jClient from '../../../utils/neo4j';
import { IRelationship } from '../../relationships/interfaces';
import RelationshipManager from '../../relationships/manager';
import Server from '../../server';
import { IEntity, ISearchBatchBody } from '../interface';
import EntityManager from '../manager';

const { neo4j } = config;

const { BAD_REQUEST: badRequestStatus, OK: okStatus } = StatusCodes;

const defaultTemplateId = uuidv4(); // supposed to be mongoId, but good enough
// const defaultProperties = { testProp: 'testProp' };

const {
    airportEntityTemplate,
    departureFromRelationshipTemplate,
    flightEntityTemplate,
    flightsOnRelationshipTemplate,
    travelAgentEntityTemplate,
    tripConnectedToFlightRelationshipTemplate,
    tripEntityTemplate,
} = generateTemplates();

const entityTemplate: IMongoEntityTemplate = {
    _id: defaultTemplateId,
    propertiesOrder: ['testProp', 'name', 'lastName', 'age', 'salary', 'bDate', 'timeOfDeath', 'doesWork', 'num'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['testProp'],
    name: 'template',
    displayName: 'template',
    category: '999999999999999999999999',
    properties: {
        type: 'object',
        properties: {
            testProp: { type: 'string', title: 'testProp' },

            name: { type: 'string', title: 'name' },
            lastName: { type: 'string', title: 'name' },
            age: { type: 'number', title: 'age' },
            salary: { type: 'number', title: 'salary' },

            bDate: { type: 'string', format: 'date', title: 'bDate' },
            timeOfDeath: { type: 'string', format: 'date-string', title: 'timeOfDeath' },

            doesWork: { type: 'boolean', title: 'doesWork' },

            num: { type: 'number', title: 'num' },

            // in purpose number (not string) for test checking sort on field with conflict types (with flight)
            from: { type: 'number', title: 'from' },

            // in purpose string (not date), for test checking sort on field with conflict types (with flight)
            landingDate: { type: 'string', title: 'landingDate' },

            // in purpose stupid format, for test checking sort on field with conflict types (with airport)
            airportId: { type: 'string', format: 'email', title: 'airportId' },
        },
        hide: [],
    },
    disabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('e2e search entities batch tests', () => {
    const mockTemplateManager = getMockAdapterTemplateManager();

    let app: Express;

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
        app = Server.createExpressApp();

        // Mock get template router - for validation middleware
        mockEntityTemplatesRoutes(mockTemplateManager, [
            entityTemplate,
            travelAgentEntityTemplate,
            flightEntityTemplate,
            tripEntityTemplate,
            airportEntityTemplate,
        ]);
        mockRelationshipTemplatesRoutes(mockTemplateManager, [
            flightsOnRelationshipTemplate,
            tripConnectedToFlightRelationshipTemplate,
            departureFromRelationshipTemplate,
        ]);
        mockRulesRoutes(
            mockTemplateManager,
            [],
            [entityTemplate._id, travelAgentEntityTemplate._id, flightEntityTemplate._id, tripEntityTemplate._id, airportEntityTemplate._id],
        );
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultTemplateId);
    });

    describe('check results with relationships', () => {
        let travelAgent1: IEntity;
        let travelAgent2: IEntity;
        let travelAgent3: IEntity;
        let flight1: IEntity;
        let flight2: IEntity;
        let trip1: IEntity;
        let trip2: IEntity;
        let trip3: IEntity;
        let airport1: IEntity;
        let travelAgent1Toflight1: IRelationship;
        let travelAgent2Toflight1: IRelationship;
        let travelAgent3Toflight2: IRelationship;
        let flight1ToTrip1: IRelationship;
        let flight1ToTrip2: IRelationship;
        let flight2ToTrip3: IRelationship;
        let flight1ToAirport1: IRelationship;
        beforeEach(async () => {
            await EntityManager.deleteByTemplateId(travelAgentEntityTemplate._id);
            await EntityManager.deleteByTemplateId(flightEntityTemplate._id);
            await EntityManager.deleteByTemplateId(tripEntityTemplate._id);
            await EntityManager.deleteByTemplateId(airportEntityTemplate._id);
        });

        beforeEach(async () => {
            flight1 = (await EntityManager.createEntity({ flightNumber: '1' }, flightEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            flight2 = (await EntityManager.createEntity({ flightNumber: '2' }, flightEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            travelAgent1 = (await EntityManager.createEntity({ firstName: 'Name1' }, travelAgentEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            travelAgent2 = (await EntityManager.createEntity({ firstName: 'Name2' }, travelAgentEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            travelAgent3 = (await EntityManager.createEntity({ firstName: 'Name3' }, travelAgentEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            trip1 = (await EntityManager.createEntity({ name: 'My trip1' }, tripEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            trip2 = (await EntityManager.createEntity({ name: 'My trip2' }, tripEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            trip3 = (await EntityManager.createEntity({ name: 'My trip3' }, tripEntityTemplate, [], neo4j.mockUserId)).createdEntity;
            airport1 = (await EntityManager.createEntity({ airportName: 'My Airport1' }, airportEntityTemplate, [], neo4j.mockUserId)).createdEntity;

            travelAgent1Toflight1 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: flightsOnRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: travelAgent1.properties._id,
                    destinationEntityId: flight1.properties._id,
                },
                flightsOnRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            travelAgent2Toflight1 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: flightsOnRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: travelAgent2.properties._id,
                    destinationEntityId: flight1.properties._id,
                },
                flightsOnRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            travelAgent3Toflight2 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: flightsOnRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: travelAgent3.properties._id,
                    destinationEntityId: flight2.properties._id,
                },
                flightsOnRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            flight1ToTrip1 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: tripConnectedToFlightRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: flight1.properties._id,
                    destinationEntityId: trip1.properties._id,
                },
                tripConnectedToFlightRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            flight1ToTrip2 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: tripConnectedToFlightRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: flight1.properties._id,
                    destinationEntityId: trip2.properties._id,
                },
                tripConnectedToFlightRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            flight2ToTrip3 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: tripConnectedToFlightRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: flight2.properties._id,
                    destinationEntityId: trip3.properties._id,
                },
                tripConnectedToFlightRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
            flight1ToAirport1 = await RelationshipManager.createRelationshipByEntityIds(
                {
                    templateId: departureFromRelationshipTemplate._id,
                    properties: {},
                    sourceEntityId: flight1.properties._id,
                    destinationEntityId: airport1.properties._id,
                },
                departureFromRelationshipTemplate,
                [],
                neo4j.mockUserId,
            );
        });

        it('check with no relationships', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: { [flightEntityTemplate._id]: {} },
                    sort: [{ field: 'flightNumber', sort: 'asc' }],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(2);
            expect(res.body.entities).toHaveLength(2);

            expect(res.body.entities).toEqual(
                expect.arrayContaining([
                    { entity: flight1, relationships: undefined },
                    { entity: flight1, relationships: undefined },
                ]),
            );
        });

        it('check with all relationship types', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: { [flightEntityTemplate._id]: { showRelationships: true } },
                    sort: [{ field: 'flightNumber', sort: 'asc' }],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(2);
            expect(res.body.entities).toHaveLength(2);

            const [flight1Result, flight2Result] = res.body.entities;

            expect(flight1Result.entity).toEqual(flight1);
            expect(flight1Result.relationships).toBeDefined();
            expect(flight1Result.relationships.length).toBe(5);
            const expectedRelationshipsOfFlight1 = [
                {
                    relationship: travelAgent1Toflight1,
                    otherEntity: travelAgent1,
                },
                {
                    relationship: travelAgent2Toflight1,
                    otherEntity: travelAgent2,
                },
                {
                    relationship: flight1ToTrip1,
                    otherEntity: trip1,
                },
                {
                    relationship: flight1ToTrip2,
                    otherEntity: trip2,
                },
                {
                    relationship: flight1ToAirport1,
                    otherEntity: airport1,
                },
            ];
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[0]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[1]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[2]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[3]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[4]);

            expect(flight2Result.entity).toEqual(flight2);
            expect(flight2Result.relationships).toBeDefined();
            expect(flight2Result.relationships.length).toBe(2);
            const expectedRelationshipsOfFlight2 = [
                {
                    relationship: travelAgent3Toflight2,
                    otherEntity: travelAgent3,
                },
                {
                    relationship: flight2ToTrip3,
                    otherEntity: trip3,
                },
            ];
            expect(expectedRelationshipsOfFlight2).toContainEqual(flight2Result.relationships[0]);
            expect(expectedRelationshipsOfFlight2).toContainEqual(flight2Result.relationships[1]);
        });

        it('check with some relationship types', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: {
                        [flightEntityTemplate._id]: {
                            showRelationships: [flightsOnRelationshipTemplate._id, departureFromRelationshipTemplate._id],
                        },
                    },
                    sort: [{ field: 'flightNumber', sort: 'asc' }],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(2);
            expect(res.body.entities).toHaveLength(2);

            const [flight1Result, flight2Result] = res.body.entities;

            expect(flight1Result.entity).toEqual(flight1);
            expect(flight1Result.relationships).toBeDefined();
            expect(flight1Result.relationships.length).toBe(3);
            const expectedRelationshipsOfFlight1 = [
                {
                    relationship: travelAgent1Toflight1,
                    otherEntity: travelAgent1,
                },
                {
                    relationship: travelAgent2Toflight1,
                    otherEntity: travelAgent2,
                },
                {
                    relationship: flight1ToAirport1,
                    otherEntity: airport1,
                },
            ];
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[0]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[1]);

            expect(flight2Result.entity).toEqual(flight2);
            expect(flight2Result.relationships).toBeDefined();
            expect(flight2Result.relationships.length).toBe(1);
            const expectedRelationshipsOfFlight2 = [
                {
                    relationship: travelAgent3Toflight2,
                    otherEntity: travelAgent3,
                },
            ];
            expect(expectedRelationshipsOfFlight2).toContainEqual(flight2Result.relationships[0]);
        });

        it('check with mix "relationships" config per template', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: {
                        [flightEntityTemplate._id]: {
                            showRelationships: [flightsOnRelationshipTemplate._id, tripConnectedToFlightRelationshipTemplate._id],
                        },
                        [travelAgentEntityTemplate._id]: {},
                        [tripEntityTemplate._id]: { showRelationships: true },
                        [airportEntityTemplate._id]: { showRelationships: [departureFromRelationshipTemplate._id] },
                    },
                    sort: [],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(9);
            expect(res.body.entities).toHaveLength(9);

            const flight1Result = res.body.entities.find(({ entity }) => entity.properties._id === flight1.properties._id);
            const flight2Result = res.body.entities.find(({ entity }) => entity.properties._id === flight2.properties._id);
            const travelAgent1Result = res.body.entities.find(({ entity }) => entity.properties._id === travelAgent1.properties._id);
            const travelAgent2Result = res.body.entities.find(({ entity }) => entity.properties._id === travelAgent2.properties._id);
            const travelAgent3Result = res.body.entities.find(({ entity }) => entity.properties._id === travelAgent3.properties._id);
            const trip1Result = res.body.entities.find(({ entity }) => entity.properties._id === trip1.properties._id);
            const trip2Result = res.body.entities.find(({ entity }) => entity.properties._id === trip2.properties._id);
            const trip3Result = res.body.entities.find(({ entity }) => entity.properties._id === trip3.properties._id);
            const airport1Result = res.body.entities.find(({ entity }) => entity.properties._id === airport1.properties._id);

            expect(flight1Result.entity).toEqual(flight1);
            expect(flight1Result.relationships).toBeDefined();
            expect(flight1Result.relationships.length).toBe(4);
            const expectedRelationshipsOfFlight1 = [
                {
                    relationship: travelAgent1Toflight1,
                    otherEntity: travelAgent1,
                },
                {
                    relationship: travelAgent2Toflight1,
                    otherEntity: travelAgent2,
                },
                {
                    relationship: flight1ToTrip1,
                    otherEntity: trip1,
                },
                {
                    relationship: flight1ToTrip2,
                    otherEntity: trip2,
                },
            ];
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[0]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[1]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[2]);
            expect(expectedRelationshipsOfFlight1).toContainEqual(flight1Result.relationships[3]);

            expect(flight2Result.entity).toEqual(flight2);
            expect(flight2Result.relationships).toBeDefined();
            expect(flight2Result.relationships.length).toBe(2);
            const expectedRelationshipsOfFlight2 = [
                {
                    relationship: travelAgent3Toflight2,
                    otherEntity: travelAgent3,
                },
                {
                    relationship: flight2ToTrip3,
                    otherEntity: trip3,
                },
            ];
            expect(expectedRelationshipsOfFlight2).toContainEqual(flight2Result.relationships[0]);

            expect([travelAgent1Result, travelAgent2Result, travelAgent3Result]).toEqual([
                { entity: travelAgent1, relationships: undefined },
                { entity: travelAgent2, relationships: undefined },
                { entity: travelAgent3, relationships: undefined },
            ]);

            expect([trip1Result, trip2Result, trip3Result]).toEqual([
                { entity: trip1, relationships: [{ relationship: flight1ToTrip1, otherEntity: flight1 }] },
                { entity: trip2, relationships: [{ relationship: flight1ToTrip2, otherEntity: flight1 }] },
                { entity: trip3, relationships: [{ relationship: flight2ToTrip3, otherEntity: flight2 }] },
            ]);

            expect(airport1Result).toEqual({
                entity: airport1,
                relationships: [{ relationship: flight1ToAirport1, otherEntity: flight1 }],
            });
        });
    });

    describe('check filter', () => {
        describe.each([
            { type: 'string', field: 'name', value1: 'AnotherName', value2: 'Dangerous \' " / \\', value3: 'Name' },
            { type: 'number', field: 'age', value1: 1, value2: 2, value3: 3 },
            { type: 'date', field: 'bDate', value1: '2002-05-03', value2: '2002-05-04', value3: '2002-05-05' },
            {
                type: 'date-time',
                field: 'timeOfDeath',
                value1: '2102-05-03T08:00:00.000Z',
                value2: '2102-05-03T10:00:00.000Z',
                value3: '2102-05-04T12:00:00.000Z',
            },
        ])('basic check filter $type field', ({ field, value1, value2, value3 }) => {
            beforeEach(async () => {
                await EntityManager.createEntity({ [field]: value1 }, entityTemplate, [], neo4j.mockUserId);
                await EntityManager.createEntity({ [field]: value2 }, entityTemplate, [], neo4j.mockUserId);
                await EntityManager.createEntity({ [field]: value3 }, entityTemplate, [], neo4j.mockUserId);
            });

            it('$eq', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: { [defaultTemplateId]: { filter: { $and: { [field]: { $eq: value1 } } } },
                    sort: [],
                },
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(1);
                expect(res.body.entities).toHaveLength(1);

                expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
                expect(res.body.entities[0].entity.properties).toEqual(
                    expect.objectContaining({
                        [field]: value1,
                    }),
                );
            });
            it('$ne', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $ne: value1 } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value2,
                        }),
                        expect.objectContaining({
                            [field]: value3,
                        }),
                    ]),
                );
            });
            it('$gt', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $gt: value1 } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value2,
                        }),
                        expect.objectContaining({
                            [field]: value3,
                        }),
                    ]),
                );
            });
            it('$gte', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $gte: value2 } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value2,
                        }),
                        expect.objectContaining({
                            [field]: value3,
                        }),
                    ]),
                );
            });
            it('$lt', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $lt: value3 } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value1,
                        }),
                        expect.objectContaining({
                            [field]: value2,
                        }),
                    ]),
                );
            });
            it('$lte', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $lte: value2 } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value1,
                        }),
                        expect.objectContaining({
                            [field]: value2,
                        }),
                    ]),
                );
            });
            it('$in', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: {
                            filter: { $and: { [field]: { $in: [value1, value3] } } },
                        },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value1,
                        }),
                        expect.objectContaining({
                            [field]: value3,
                        }),
                    ]),
                );
            });
            it('$not with $eq', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { [field]: { $not: { $eq: value1 } } } } },
                    },
                    sort: [{ field, sort: 'asc' }],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(2);
                expect(res.body.entities).toHaveLength(2);

                expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            [field]: value2,
                        }),
                        expect.objectContaining({
                            [field]: value3,
                        }),
                    ]),
                );
            });
        });

        describe('check filter string field', () => {
            const entityWithName: IEntity = { templateId: defaultTemplateId, properties: { name: 'Name' } };
            const entityWithAnotherName: IEntity = { templateId: defaultTemplateId, properties: { name: 'AnotherName' } };
            const entityWithDangerousChars: IEntity = { templateId: defaultTemplateId, properties: { name: 'Dangerous \' " / \\' } };

            beforeEach(async () => {
                await EntityManager.createEntity(entityWithName.properties, entityTemplate, [], neo4j.mockUserId);
                await EntityManager.createEntity(entityWithAnotherName.properties, entityTemplate, [], neo4j.mockUserId);
                await EntityManager.createEntity(entityWithDangerousChars.properties, entityTemplate, [], neo4j.mockUserId);
            });

            it('$eq escape dangerous characters', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: {
                            filter: { $and: { name: { $eq: entityWithDangerousChars.properties.name } } },
                        },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(1);
                expect(res.body.entities).toHaveLength(1);

                expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
                expect(res.body.entities[0].entity.properties).toEqual(
                    expect.objectContaining({
                        name: entityWithDangerousChars.properties.name,
                    }),
                );
            });
            it('$eqi', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { name: { $eqi: 'AnOtHeRnaMe' } } } },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(1);
                expect(res.body.entities).toHaveLength(1);

                expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
                expect(res.body.entities[0].entity.properties).toEqual(
                    expect.objectContaining({
                        name: entityWithAnotherName.properties.name,
                    }),
                );
            });
            it('$rgx', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 3,
                    templates: {
                        [defaultTemplateId]: { filter: { $and: { name: { $rgx: '(?i).*AnOtHeRn.*' } } } },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(okStatus);
                expect(res.body.count).toBe(1);
                expect(res.body.entities).toHaveLength(1);

                expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
                expect(res.body.entities[0].entity.properties).toEqual(
                    expect.objectContaining({
                        name: entityWithAnotherName.properties.name,
                    }),
                );
            });
        });

        it('check $or', async () => {
            await Promise.all([
                EntityManager.createEntity({ num: 1, name: '111' }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 2, name: '222' }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 3, name: '333' }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 4, name: '444' }, entityTemplate, [], neo4j.mockUserId),
            ]);

            const searchBody: ISearchBatchBody = {
                skip: 0,
                limit: 4,
                templates: { [defaultTemplateId]: { filter: { $or: [{ num: { $gt: 2 } }, { name: { $eq: '111' } }] } } },
                sort: [{ field: 'num', sort: 'asc' }],
            };
            const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(3);
            expect(res.body.entities).toHaveLength(3);

            expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        num: 1,
                    }),
                    expect.objectContaining({
                        num: 3,
                    }),
                    expect.objectContaining({
                        num: 4,
                    }),
                ]),
            );
        });
    });

    describe('check global search', () => {
        beforeAll(async () => {
            // Configure global search index in neo4j
            await Neo4jClient.writeTransaction(
                `CALL db.index.fulltext.createNodeIndex(
                    'globalSearchTest',
                    ['${defaultTemplateId}'],
                    ['name'],
                    { analyzer: 'unicode_whitespace' }
                )`,
                () => {},
            );
        });

        afterAll(async () => {
            // Delete global search index in neo4j
            await Neo4jClient.writeTransaction(`CALL db.index.fulltext.drop('globalSearchTest')`, () => {});
        });

        beforeEach(async () => {
            await EntityManager.createEntity({ name: 'Name', age: 1, lastName: 'lastName' }, entityTemplate, [], neo4j.mockUserId);
            await EntityManager.createEntity({ name: 'AnotherName', age: 2 }, entityTemplate, [], neo4j.mockUserId);
            await EntityManager.createEntity({ name: 'Name with lucene-special-chars (((', age: 3 }, entityTemplate, [], neo4j.mockUserId);
        });

        it('check simple search query', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: { [defaultTemplateId]: {} },
                    textSearch: 'Another',
                    sort: [],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(1);
            expect(res.body.entities).toHaveLength(1);
            expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[0].entity.properties).toEqual(
                expect.objectContaining({
                    name: 'AnotherName',
                }),
            );
        });

        it('check search with sort query', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 3,
                    templates: { [defaultTemplateId]: {} },
                    textSearch: 'Name',
                    sort: [{ field: 'age', sort: 'asc' }],
                });

            expect(res).toBeDefined();
            expect(res.body.count).toBe(3);
            expect(res.body.entities).toHaveLength(3);

            expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[0].entity.properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    name: 'Name',
                }),
            );

            expect(res.body.entities[1].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[1].entity.properties).toEqual(
                expect.objectContaining({
                    age: 2,
                    name: 'AnotherName',
                }),
            );

            expect(res.body.entities[2].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[2].entity.properties).toEqual(
                expect.objectContaining({
                    age: 3,
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });

        it('check search with sort query and filter query', async () => {
            const searchBody: ISearchBatchBody = {
                skip: 0,
                limit: 3,
                templates: {
                    [defaultTemplateId]: {
                        filter: { $and: { lastName: { $eq: 'lastName' } } },
                    },
                },
                sort: [{ field: 'age', sort: 'asc' }],
            };
            const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(1);
            expect(res.body.entities).toHaveLength(1);

            expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[0].entity.properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    name: 'Name',
                    lastName: 'lastName',
                }),
            );
        });

        it('check search with lucene special characters', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: { [defaultTemplateId]: {} },
                    textSearch: '(((',
                    sort: [],
                });

            expect(res).toBeDefined();
            expect(res.body.count).toBe(1);
            expect(res.body.entities).toHaveLength(1);
            expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[0].entity.properties).toEqual(
                expect.objectContaining({
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });

        it('check search with wildstar with non-letter characters', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 10,
                    templates: { [defaultTemplateId]: {} },
                    textSearch: 'with lucene-speci',
                    sort: [],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(1);
            expect(res.body.entities).toHaveLength(1);
            expect(res.body.entities[0].entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entities[0].entity.properties).toEqual(
                expect.objectContaining({
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });
    });

    describe('check skip and limit', () => {
        beforeEach(async () => {
            await Promise.all([
                EntityManager.createEntity({ num: 1 }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 2 }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 3 }, entityTemplate, [], neo4j.mockUserId),
                EntityManager.createEntity({ num: 4 }, entityTemplate, [], neo4j.mockUserId),
            ]);
        });

        it('check sort model query with start row and end row', async () => {
            const res = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 0,
                    limit: 2,
                    templates: { [defaultTemplateId]: {} },
                    sort: [{ field: 'num', sort: 'asc' }],
                });

            expect(res.statusCode).toBe(okStatus);
            expect(res.body.count).toBe(4);
            expect(res.body.entities).toHaveLength(2);

            expect(res.body.entities.map(({ entity }) => entity.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        num: 1,
                    }),
                    expect.objectContaining({
                        num: 2,
                    }),
                ]),
            );

            const secondRes = await request(app)
                .post('/api/instances/entities/search/batch')
                .send({
                    skip: 2,
                    limit: 2,
                    templates: { [defaultTemplateId]: {} },
                    sort: [{ field: 'num', sort: 'asc' }],
                });

            expect(secondRes.statusCode).toBe(okStatus);
            expect(secondRes.body.count).toBe(4);
            expect(secondRes.body.entities).toHaveLength(2);

            expect(secondRes.body.entities.map(({ entity }) => entity.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        num: 3,
                    }),
                    expect.objectContaining({
                        num: 4,
                    }),
                ]),
            );
        });
    });

    describe('check validation', () => {
        describe('check validation of filter object', () => {
            it.each([
                { filterType: '$eq' },
                { filterType: '$ne' },
                { filterType: '$gt' },
                { filterType: '$gte' },
                { filterType: '$lt' },
                { filterType: '$lte' },
            ])('simple filter of $filterType rhs should have same type of field', async ({ filterType }) => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 10,
                    templates: {
                        [entityTemplate._id]: {
                            filter: {
                                $and: {
                                    name: { [filterType]: 5 }, // in purpose filtering by number on string field
                                },
                            },
                        },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(
                    `filter on field templates.${entityTemplate._id}.filter.$and.name.${filterType} should be of type string`,
                );
            });

            it('filter of $in rhs should have same type of field', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 10,
                    templates: {
                        [entityTemplate._id]: {
                            filter: {
                                $and: {
                                    name: { $in: [5] }, // in purpose filtering by number on string field
                                },
                            },
                        },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(`filter on field templates.${entityTemplate._id}.filter.$and.name.$in.0 should be of type string`);
            });

            it('$eqi filter only on string field', async () => {
                const searchBody: ISearchBatchBody = {
                    skip: 0,
                    limit: 10,
                    templates: {
                        [entityTemplate._id]: {
                            filter: {
                                $and: {
                                    bDate: { $eqi: '2002-05-03' }, // in purpose on bDate field which is date type
                                },
                            },
                        },
                    },
                    sort: [],
                };
                const res = await request(app).post('/api/instances/entities/search/batch').send(searchBody);

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(
                    `filter on field templates.${entityTemplate._id}.filter.$and.bDate.$eqi is invalid. must be on field of type strict string (not date format)`,
                );
            });
        });
        describe('check validation of sort object', () => {
            it('some template doesnt have field', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [flightEntityTemplate._id]: {
                            },
                            [airportEntityTemplate._id]: {
                            },
                        },
                        sort: [
                            { field: 'createdAt', sort: 'asc' },
                            // exists only in airport, but not in flight
                            { field: 'airportName', sort: 'asc' },
                        ],
                    });

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(
                    `sort.1.field "airportName" must exist in all templates of search, but doesnt exist in template id "${flightEntityTemplate._id}"`,
                );
            });
            it('2 templates have conflict on field type', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [flightEntityTemplate._id]: {
                            },
                            [entityTemplate._id]: {
                            },
                        },
                        sort: [
                            { field: 'createdAt', sort: 'asc' },
                            // exists in flight & entityTemplate, but different types
                            { field: 'from', sort: 'asc' },
                        ],
                    });

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toMatch(/sort\.1\.field "from" must be the same type in all templates of search/);
            });
            it('2 templates have conflict on field type (same type, but one with format of date)', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [flightEntityTemplate._id]: {
                            },
                            [entityTemplate._id]: {
                            },
                        },
                        sort: [
                            { field: 'createdAt', sort: 'asc' },
                            // exists in flight & entityTemplate, but different types
                            { field: 'landingDate', sort: 'asc' },
                        ],
                    });

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toMatch(/sort\.1\.field "landingDate" must be the same type in all templates of search/);
            });
            it('2 templates have different formats on string field type, but not dates. shouldnt fail', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [airportEntityTemplate._id]: {
                            },
                            [entityTemplate._id]: {
                            },
                        },
                        sort: [
                            { field: 'createdAt', sort: 'asc' },
                            // exists in airport & entityTemplate, but different types
                            { field: 'airportId', sort: 'asc' },
                        ],
                    });

                expect(res.statusCode).toBe(okStatus);
            });
        });
        describe('check validation of showRelationships with templates', () => {
            it('check validation of showRelationships with unknown relationship', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [tripEntityTemplate._id]: {
                                showRelationships: [tripConnectedToFlightRelationshipTemplate._id, 'unknown-relationship-template'],
                            },
                        },
                        sort: [],
                    });

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(
                    `relationship template id "unknown-relationship-template" doesnt exist in templates.${tripEntityTemplate._id}.showRelationships.1`,
                );
            });
            it('check validation of showRelationships with relationship not related to entity template', async () => {
                const res = await request(app)
                    .post('/api/instances/entities/search/batch')
                    .send({
                        skip: 0,
                        limit: 10,
                        templates: {
                            [tripEntityTemplate._id]: {
                                // flightsOn is not relationship of trip!
                                showRelationships: [tripConnectedToFlightRelationshipTemplate._id, flightsOnRelationshipTemplate._id],
                            },
                        },
                        sort: [],
                    });

                expect(res.statusCode).toBe(badRequestStatus);
                expect(res.body.type).toEqual('TemplateValidationError');
                expect(res.body.message).toBe(
                    `relationship template id "${flightsOnRelationshipTemplate._id}" doesnt exist in templates.${tripEntityTemplate._id}.showRelationships.1`,
                );
            });
        });
    });
});
