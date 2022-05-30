import { Express } from 'express';
import request from 'supertest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import Neo4jClient from '../../utils/neo4j';
import Server from '../server';
import config from '../../config';
import { formatDate } from '../../utils/neo4j/lib';

const mockDate = new Date();
const mockDateStr = mockDate.toISOString();

const defaultRelationshipTemplateId = 'rel-entity-router';
const defaultTemplateId = '3';
const defaultProperties = { testProp: 'testProp' };
const defaultEntity = {
    templateId: defaultTemplateId,
    properties: defaultProperties,
};

const { templateManager, relationshipManager, neo4j } = config;

describe('Entity router', () => {
    const mock = new MockAdapter(axios);

    let app: Express;

    beforeEach(() => {
        app = Server.createExpressApp();
    });

    beforeAll(async () => {
        // Initialize Neo4j client
        await Neo4jClient.initialize(neo4j.url, neo4j.auth);

        // Mock get template router - for validation middleware
        const { url, getByIdRoute } = templateManager;

        mock.onGet(`${url}${getByIdRoute}/${defaultTemplateId}`).reply(200, {
            _id: defaultTemplateId,
            name: 'testTemplate',
            displayName: 'testTemplate',
            category: {
                _id: '1234',
                name: 'testCatergory',
                displayName: 'testCatergory',
                createdAt: mockDateStr,
                updatedAt: mockDateStr,
                __v: 0,
            },
            properties: {
                type: 'object',
                required: ['testProp'],
                properties: {
                    testProp: {
                        type: 'string',
                        title: 'testProp',
                    },
                    mockDate: {
                        type: 'string',
                        format: 'date',
                        title: 'mockDate',
                    },
                },
            },
            disabled: false,
            createdAt: mockDateStr,
            updatedAt: mockDateStr,
            __v: 0,
        });
    });

    afterAll(async () => {
        await request(app).delete(`/api/instances/entities/${defaultTemplateId}`);

        await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${defaultRelationshipTemplateId}\`]-() DELETE r `, () => {});
        await Neo4jClient.close();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(200);

            expect(response.text).toBe('alive');
        });
    });

    describe('/badRoute', () => {
        it('should return invalid route', async () => {
            const response = await request(app).get('/badRoute').expect(404);

            expect(response.text).toBe('Invalid Route');
        });
    });

    describe('POST /api/instances/entities', () => {
        it('Should create new entity', async () => {
            const res = await request(app)
                .post('/api/instances/entities')
                .send({ templateId: defaultTemplateId, properties: { ...defaultProperties, mockDate: formatDate(mockDateStr) } });

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.templateId).toBe(defaultTemplateId);
            expect(res.body.properties).toEqual(expect.objectContaining(defaultProperties));
        });

        it('Should fail to create a new entity', async () => {
            const res = await request(app).post('/api/instances/entities').send({ properties: defaultProperties });

            expect(res.statusCode).toBe(400);
            expect(res.body.type).toEqual('ValidationError');
        });
    });

    describe('PUT /api/instances/entities/:templateId', () => {
        let id: string;

        const newProperties = {
            testProp: 'newTestProp',
        };

        beforeEach(async () => {
            const res = await request(app).post('/api/instances/entities').send(defaultEntity);

            id = res.body.properties._id;
        });

        it('Should update an existing entity', async () => {
            const res = await request(app).put(`/api/instances/entities/${id}`).send({ templateId: defaultTemplateId, properties: newProperties });

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.templateId).toBe(defaultTemplateId);
            expect(res.body.properties).toEqual(expect.objectContaining(newProperties));
        });

        it('Should fail to update an entity (entity not found)', async () => {
            const unknownId = 'unknown_id';

            const res = await request(app)
                .put(`/api/instances/entities/${unknownId}`)
                .send({ templateId: defaultTemplateId, properties: newProperties });

            expect(res.statusCode).toBe(404);
            expect(res.body.type).toEqual('NotFound');
            expect(res.body.message).toEqual(`[NEO4J] entity "${unknownId}" not found`);
        });

        // Add validation error for PUT
    });

    describe('GET /api/instances/entities/:id', () => {
        let id: string;

        beforeEach(async () => {
            const res = await request(app).post('/api/instances/entities').send(defaultEntity);

            id = res.body.properties._id;
        });

        it('Should get an existing entity', async () => {
            const res = await request(app).get(`/api/instances/entities/${id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.templateId).toBe(defaultTemplateId);
            expect(res.body.properties).toEqual(expect.objectContaining(defaultProperties));
        });

        it('Should fail to get an existing entity', async () => {
            const unknownId = 'unknown_id';

            const res = await request(app).get(`/api/instances/entities/${unknownId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.type).toEqual('NotFound');
            expect(res.body.message).toEqual(`[NEO4J] entity "${unknownId}" not found`);
        });
    });

    describe('GET /api/instances/entities/:id?expanded=true', () => {
        let id: string;

        beforeEach(async () => {
            const res = await request(app).post('/api/instances/entities').send(defaultEntity);

            id = res.body.properties._id;
        });

        it('Should get an existing entity (expanded mode - without connections)', async () => {
            const res = await request(app).get(`/api/instances/entities/${id}?expanded=true`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.entity.templateId).toBe(defaultTemplateId);
            expect(res.body.entity.properties).toEqual(expect.objectContaining(defaultProperties));
            expect(res.body.connections.length).toStrictEqual(0);
        });

        it('Should fail to get an existing entity (expanded mode - without connections)', async () => {
            const unknownId = 'unknown_id';

            const res = await request(app).get(`/api/instances/entities/${unknownId}?expanded=true`);

            expect(res.statusCode).toBe(404);
            expect(res.body.type).toEqual('NotFound');
            expect(res.body.message).toEqual(`[NEO4J] entity "${unknownId}" not found`);
        });
    });

    describe('DELETE /api/instances/entities/:id', () => {
        let id: string;

        beforeEach(async () => {
            const entity = await request(app).post('/api/instances/entities').send(defaultEntity);

            id = entity.body.properties._id;
        });

        it('Should delete an existing entity', async () => {
            const res = await request(app).delete(`/api/instances/entities/${id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toStrictEqual(id);
        });

        it('Should fail to delete an existing entity', async () => {
            const unknownId = 'unknown_id';

            const res = await request(app).delete(`/api/instances/entities/${unknownId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.type).toEqual('NotFound');
            expect(res.body.message).toEqual(`[NEO4J] entity "${unknownId}" not found`);
        });

        it('Should delete an existing entity (deleteAllRelationships=true)', async () => {
            const res = await request(app).delete(`/api/instances/entities/${id}?deleteAllRelationships=true`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toStrictEqual(id);
        });

        describe('With connections', () => {
            const secondEntityProperties = { testProp: 'testProp' };

            beforeEach(async () => {
                // Create second entity
                const secondEntity = await request(app)
                    .post('/api/instances/entities')
                    .send({ templateId: defaultTemplateId, properties: secondEntityProperties });

                const { url, getByIdRoute } = relationshipManager;

                // Mock get relationship template route
                mock.onGet(`${url}${getByIdRoute}/${defaultRelationshipTemplateId}`).reply(200, {
                    _id: '123',
                    name: 'RelationshipMock',
                    displayName: 'RelationshipMock',
                    sourceEntityId: defaultTemplateId,
                    destinationEntityId: defaultTemplateId,
                    createdAt: mockDateStr,
                    updatedAt: mockDateStr,
                    __v: 0,
                });

                // Create relationship between two entities
                await request(app).post('/api/instances/relationships').send({
                    templateId: defaultRelationshipTemplateId,
                    properties: defaultProperties,
                    sourceEntityId: id,
                    destinationEntityId: secondEntity.body.properties._id,
                });
            });

            it('Should fail to delete an existing entity because it has connections', async () => {
                const res = await request(app).delete(`/api/instances/entities/${id}?deleteAllRelationships=false`);

                expect(res.statusCode).toBe(400);
                expect(res.body.message).toEqual(`[NEO4J] entity "${id}" has existing relationships. Delete them first.`);
            });

            it('Should delete an existing entity and its connections', async () => {
                const res = await request(app).delete(`/api/instances/entities/${id}?deleteAllRelationships=true`);

                expect(res.statusCode).toBe(200);
                expect(res.body).toStrictEqual(id);
            });
        });
    });

    describe(`DELETE /api/instances/entities?templateId=${defaultTemplateId}`, () => {
        beforeEach(async () => {
            await request(app).post('/api/instances/entities').send(defaultEntity);
        });

        it('Should get an existing entity (expanded mode - without connections)', async () => {
            const res = await request(app).delete(`/api/instances/entities?templateId=${defaultTemplateId}`);

            expect(res.statusCode).toBe(200);
        });
    });
});
