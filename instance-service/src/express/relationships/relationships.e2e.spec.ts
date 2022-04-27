import request from 'supertest';
import MockAdapter from 'axios-mock-adapter';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import axios from 'axios';

import Neo4jClient from '../../utils/neo4j';
import config from '../../config';
import Server from '../server';

const { neo4j, templateManager, relationshipManager } = config;

const TEMPLATE_ID = '623c41a6146aa2597e6f30cb';

describe('e2e relationships tests', () => {
    const mock = new MockAdapter(axios);
    let app: Express;

    beforeAll(async () => {
        mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${TEMPLATE_ID}`).reply(200, {
            _id: TEMPLATE_ID,
            name: 'test2',
            displayName: 'test2',
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
            createdAt: '2022-03-24T10:02:14.952Z',
            updatedAt: '2022-03-24T10:02:14.952Z',
            __v: 0,
        });

        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
    });

    afterAll(async () => {
        await request(app).delete(`/api/entities?templateId=${TEMPLATE_ID}`).expect(200);
        await Neo4jClient.close();
    });

    beforeEach(() => {
        app = Server.createExpressApp();
    });

    describe('/api/relationships', () => {
        let relationshipId: string;

        describe('POST /api/relationships', () => {
            it('Should create new relationship', async () => {
                const firstNode = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'firstNode',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const secondNode = {
                    templateId: TEMPLATE_ID,
                    properties: {
                        name: 'secondNode',
                        age: 25,
                        gender: 'Male',
                    },
                };

                const createResponseForFirstNode = await request(app).post('/api/entities').send(firstNode).expect(200);
                const createResponseForSecondNode = await request(app).post('/api/entities').send(secondNode).expect(200);

                const { _id: firstNodeId } = createResponseForFirstNode.body.properties;
                const { _id: secondNodeId } = createResponseForSecondNode.body.properties;

                const relationship = {
                    templateId: 'RELATIONSHIP',
                    properties: {
                        prop: 'prop',
                        name: 'example',
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

                const result = await request(app).post('/api/relationships').send(relationship).expect(200);

                relationshipId = result.body.properties._id;
            });

            it('Should fail to create a new relationship', async () => {
                const relationship = {
                    templateId: 'FAILEDRELATIONSHIP',
                    properties: {
                        prop: 'prop',
                    },
                    sourceEntityId: uuidv4(),
                    destinationEntityId: uuidv4(),
                };

                mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/FAILEDRELATIONSHIP`).reply(200, {
                    _id: '623c88c909aeb5002fd9b58b',
                    name: 'name',
                    displayName: 'name',
                    sourceEntityId: TEMPLATE_ID,
                    destinationEntityId: TEMPLATE_ID,
                    createdAt: '2022-03-24T15:05:45.711Z',
                    updatedAt: '2022-03-24T15:05:45.711Z',
                    __v: 0,
                });

                await request(app).post('/api/relationships').send(relationship).expect(404);
            });
        });

        describe('PUT /api/relationships/:id', () => {
            it('Should update relationship properties', async () => {
                const relationship = {
                    properties: {
                        new: 'new',
                    },
                };

                const updateResponse = await request(app).put(`/api/relationships/${relationshipId}`).send(relationship);

                expect(updateResponse.body).toEqual(
                    expect.objectContaining({
                        templateId: 'RELATIONSHIP',
                        properties: expect.objectContaining({
                            prop: expect.any(String),
                            name: expect.any(String),
                            new: expect.any(String),
                            updatedAt: expect.any(String),
                            createdAt: expect.any(String),
                            _id: expect.any(String),
                        }),
                    }),
                );
            });

            it('Should fail to update a relationship', async () => {
                const relationship = {
                    properties: {
                        new: 'new',
                    },
                };

                await request(app).put(`/api/relationships/${uuidv4()}`).send(relationship).expect(404);
            });
        });

        describe('DELETE /api/relationships/:id', () => {
            it('Should delete a relationship', async () => {
                await request(app).delete(`/api/relationships/${relationshipId}`).expect(200);
            });

            it('Should fail to delete a relationship', async () => {
                await request(app).delete(`/api/relationships/${uuidv4()}`).expect(404);
            });
        });
    });
});
