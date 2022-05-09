import request from 'supertest';
import MockAdapter from 'axios-mock-adapter';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import axios from 'axios';

import Neo4jClient from '../../utils/neo4j';
import config from '../../config';
import Server from '../server';

const { neo4j, templateManager, relationshipManager } = config;

const TEMPLATE_ID = '623ae07d146aa2597e6f2fd4';

describe('e2e entities tests', () => {
    const mock = new MockAdapter(axios);
    let app: Express;

    beforeAll(async () => {
        const { url, getByIdRoute } = templateManager;

        mock.onGet(`${url}${getByIdRoute}/${TEMPLATE_ID}`).reply(200, {
            _id: TEMPLATE_ID,
            name: 'test',
            displayName: 'test',
            category: {
                _id: '623ad164146aa2597e6f2f90',
                name: 'people',
                displayName: 'people',
                iconFileId: null,
                createdAt: '2022-03-23T07:51:00.282Z',
                updatedAt: '2022-03-23T07:51:00.282Z',
                __v: 0,
            },
            properties: {
                type: 'object',
                required: ['name', 'age', 'gender'],
                properties: {
                    name: {
                        type: 'string',
                        title: 'name',
                    },
                    age: {
                        type: 'number',
                        title: 'age',
                    },
                    gender: {
                        type: 'string',
                        title: 'gender',
                    },
                },
            },
            disabled: false,
            createdAt: '2022-03-23T08:55:25.139Z',
            updatedAt: '2022-03-23T08:55:25.139Z',
            __v: 0,
        });

        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
    });

    afterAll(async () => {
        await request(app).delete(`/api/instances/entities?templateId=${TEMPLATE_ID}`).expect(200);
        await Neo4jClient.close();
    });

    beforeEach(() => {
        app = Server.createExpressApp();
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

    describe('/api/instances/entities', () => {
        let id: string;

        describe('POST /api/instances/entities', () => {
            it('Should create new node', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'TestName',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                id = createResponse.body.properties._id;

                expect(createResponse.body).toEqual(
                    expect.objectContaining({
                        templateId: TEMPLATE_ID,
                        properties: expect.objectContaining({
                            name: 'TestName',
                            age: 25,
                            gender: 'Male',
                            updatedAt: expect.any(String),
                            createdAt: expect.any(String),
                            _id: expect.any(String),
                        }),
                    }),
                );
            });

            it('Should fail to create a new node', async () => {
                const node = {
                    properties: {
                        name: 'TestName',
                        age: 25,
                        gender: 'Male',
                    },
                };

                await request(app).post('/api/instances/entities').send(node).expect(400);
            });
        });

        describe('PUT /api/instances/entities', () => {
            it('Should edit an existing node', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'TestName',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createResponse = await request(app).post('/api/instances/entities').send(node).expect(200);

                const properties = {
                    ...createResponse.body.properties,
                    name: 'UpdatedTestName',
                    age: 30,
                    gender: 'Male',
                };

                const { _id: updatedEntityId } = createResponse.body.properties;
                const updateResponse = await request(app)
                    .put(`/api/instances/entities/${updatedEntityId}`)
                    .send({ templateId: TEMPLATE_ID, properties })
                    .expect(200);

                expect(updateResponse.body).toEqual(
                    expect.objectContaining({
                        templateId: TEMPLATE_ID,
                        properties: expect.objectContaining({
                            name: 'UpdatedTestName',
                            age: 30,
                            gender: 'Male',
                            updatedAt: expect.any(String),
                            createdAt: expect.any(String),
                            _id: updatedEntityId,
                        }),
                    }),
                );
            });

            it('Should not find node to update', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'NewTestName',
                        age: 25,
                        gender: 'Male',
                    },
                };

                await request(app).put(`/api/instances/entities/${uuidv4()}`).send(node).expect(404);
            });
        });

        describe('GET /api/instances/entities', () => {
            it('Should return an existing node', async () => {
                const getResponse = await request(app).get(`/api/instances/entities/${id}`).expect(200);

                expect(getResponse.body).toEqual(
                    expect.objectContaining({
                        templateId: TEMPLATE_ID,
                        properties: expect.objectContaining({
                            name: expect.any(String),
                            age: expect.any(Number),
                            gender: expect.any(String),
                            updatedAt: expect.any(String),
                            createdAt: expect.any(String),
                            _id: id,
                        }),
                    }),
                );
            });

            it('Should not find node', async () => {
                await request(app).get(`/api/instances/entities/${uuidv4()}`).expect(404);
            });

            it('Should return an existing node and its connections (expanded mode)', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'Connection',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createFirstNodeResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                const { _id: firstNodeId } = createFirstNodeResponse.body.properties;

                const createSecondNodeResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                const { _id: secondNodeId } = createSecondNodeResponse.body.properties;

                const firstRelationship = {
                    templateId: 'RELATIONSHIP1',
                    properties: {
                        prop: 'prop',
                        name: 'example1',
                    },
                    sourceEntityId: id,
                    destinationEntityId: firstNodeId,
                };

                const secondRelationship = {
                    templateId: 'RELATIONSHIP2',
                    properties: {
                        prop: 'prop',
                        name: 'example2',
                    },
                    sourceEntityId: id,
                    destinationEntityId: secondNodeId,
                };

                mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/RELATIONSHIP1`).reply(200, {
                    _id: '623c88c909aeb5002fd9b58b',
                    name: 'name',
                    displayName: 'name',
                    sourceEntityId: TEMPLATE_ID,
                    destinationEntityId: TEMPLATE_ID,
                    createdAt: '2022-03-24T15:05:45.711Z',
                    updatedAt: '2022-03-24T15:05:45.711Z',
                    __v: 0,
                });

                mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/RELATIONSHIP2`).reply(200, {
                    _id: '623c88c909aeb5002fd9b58b',
                    name: 'name',
                    displayName: 'name',
                    sourceEntityId: TEMPLATE_ID,
                    destinationEntityId: TEMPLATE_ID,
                    createdAt: '2022-03-24T15:05:45.711Z',
                    updatedAt: '2022-03-24T15:05:45.711Z',
                    __v: 0,
                });

                await request(app).post('/api/instances/relationships').send(firstRelationship).expect(200);
                await request(app).post('/api/instances/relationships').send(secondRelationship).expect(200);

                const getResponse = await request(app).get(`/api/instances/entities/${id}?expanded=true`).expect(200);

                expect(getResponse.body).toEqual(
                    expect.objectContaining({
                        entity: expect.objectContaining({
                            templateId: TEMPLATE_ID,
                            properties: expect.objectContaining({
                                updatedAt: expect.any(String),
                                createdAt: expect.any(String),
                                _id: id,
                            }),
                        }),
                        connections: expect.arrayContaining([
                            expect.objectContaining({
                                relationship: expect.any(Object),
                                entity: expect.any(Object),
                            }),
                            expect.objectContaining({
                                relationship: expect.any(Object),
                                entity: expect.any(Object),
                            }),
                        ]),
                    }),
                );
            });

            it('Should return an existing node without any connections (expanded mode)', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'Connection',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createFirstNodeResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                const { _id: createdEntityId } = createFirstNodeResponse.body.properties;

                const getResponse = await request(app).get(`/api/instances/entities/${createdEntityId}?expanded=true`).expect(200);

                expect(getResponse.body).toEqual(
                    expect.objectContaining({
                        entity: expect.objectContaining({
                            templateId: TEMPLATE_ID,
                            properties: expect.objectContaining({
                                updatedAt: expect.any(String),
                                createdAt: expect.any(String),
                                _id: createdEntityId,
                            }),
                        }),
                        connections: [],
                    }),
                );
            });

            it('Should not find node (expanded mode)', async () => {
                await request(app).get(`/api/instances/entities/${uuidv4()}?expanded=true`).expect(404);
            });
        });

        describe('DELETE /api/instances/entities', () => {
            it('Should delete an existing node', async () => {
                await request(app).delete(`/api/instances/entities/${id}?deleteAllRelationships=true`).expect(200);
            });

            it('Should fail to delete a node because it has existing relationships', async () => {
                const node = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'Connection',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createFirstNodeResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                const { _id: firstNodeId } = createFirstNodeResponse.body.properties;

                const createSecondNodeResponse = await request(app).post('/api/instances/entities').send(node).expect(200);
                const { _id: secondNodeId } = createSecondNodeResponse.body.properties;

                const relationship = {
                    templateId: 'RELATIONSHIP',
                    properties: {
                        prop: 'prop',
                        name: 'example1',
                    },
                    sourceEntityId: firstNodeId,
                    destinationEntityId: secondNodeId,
                };

                mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/RELATIONSHIP`).reply(200, {
                    _id: '623c88c909aeb5002fd9b58b',
                    name: 'name',
                    displayName: 'name',
                    sourceEntityId: TEMPLATE_ID,
                    destinationEntityId: TEMPLATE_ID,
                    createdAt: '2022-03-24T15:05:45.711Z',
                    updatedAt: '2022-03-24T15:05:45.711Z',
                    __v: 0,
                });

                await request(app).post('/api/instances/relationships').send(relationship).expect(200);

                const deleteResponse = await request(app).delete(`/api/instances/entities/${firstNodeId}`);

                expect(deleteResponse.statusCode).toBe(400);
                expect(deleteResponse.body).toEqual(
                    expect.objectContaining({
                        message: `[NEO4J] entity '${firstNodeId}' has existing relationships. Delete them first.`,
                        type: 'Error',
                    }),
                );
            });

            it('Should not find node', async () => {
                await request(app).delete(`/api/instances/entities/${uuidv4()}`).expect(404);
            });
        });
    });
});
