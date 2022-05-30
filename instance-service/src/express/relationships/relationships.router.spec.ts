import { Express } from 'express';
import request from 'supertest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

import Neo4jClient from '../../utils/neo4j';
import Server from '../server';
import config from '../../config';

const mockDate = new Date();
const mockDateStr = mockDate.toISOString();

const defaultEntityTemplateId = '6';
const defaultRelationshipTemplateId = 'rel-router';
const unknownId = 'unkownId';
const defaultProperties = { testProp: 'testProp' };
const defaultEntity = {
    templateId: defaultEntityTemplateId,
    properties: defaultProperties,
};

const { neo4j, templateManager, relationshipManager } = config;

describe('Relationship router', () => {
    const mock = new MockAdapter(axios);
    let app: Express;

    beforeAll(async () => {
        mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${defaultEntityTemplateId}`).reply(200, {
            _id: defaultEntityTemplateId,
            name: 'entityTest',
            displayName: 'entityTest',
            category: {
                _id: '123',
                name: 'people',
                displayName: 'people',
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
                },
            },
            disabled: false,
            createdAt: mockDateStr,
            updatedAt: mockDateStr,
            __v: 0,
        });

        mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/${defaultRelationshipTemplateId}`).reply(200, {
            _id: defaultRelationshipTemplateId,
            name: 'relTest',
            displayName: 'relTest',
            sourceEntityId: defaultEntityTemplateId,
            destinationEntityId: defaultEntityTemplateId,
            createdAt: mockDateStr,
            updatedAt: mockDateStr,
            __v: 0,
        });

        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
    });

    beforeEach(() => {
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${defaultRelationshipTemplateId}\`]-() DELETE r `, () => {});
    });

    afterAll(async () => {
        await request(app).delete(`/api/instances/entities/${defaultEntityTemplateId}`);
        await Neo4jClient.close();
    });

    describe('POST /api/instances/relationships', () => {
        it('Should create a relationship', async () => {
            // Create entities
            const firstEntity = await request(app).post('/api/instances/entities').send(defaultEntity);
            const secondEntity = await request(app).post('/api/instances/entities').send(defaultEntity);

            // Create relationship between two entities
            const { body: relBody } = await request(app).post('/api/instances/relationships').send({
                templateId: defaultRelationshipTemplateId,
                properties: defaultProperties,
                sourceEntityId: firstEntity.body.properties._id,
                destinationEntityId: secondEntity.body.properties._id,
            });

            expect(relBody.templateId).toStrictEqual(defaultRelationshipTemplateId);
            expect(relBody.properties).toEqual(expect.objectContaining(defaultProperties));
        });

        it('Should fail to create a relationship (relationship template does not exist)', async () => {
            const unknownRelId = 'unknownRelId';

            const relationship = await request(app).post('/api/instances/relationships').send({
                templateId: unknownRelId,
                properties: defaultProperties,
                sourceEntityId: unknownId,
                destinationEntityId: unknownId,
            });

            expect(relationship.statusCode).toBe(400);
            expect(relationship.body.type).toEqual('TemplateValidationError');
            expect(relationship.body.message).toEqual(`Failed to fetch relationship template schema (id: ${unknownRelId})`);
        });

        it('Should fail to create a relationship (source/destination id do not match)', async () => {
            const relTemplateId = 'relTemplateId';

            // Create entities
            const firstEntity = await request(app).post('/api/instances/entities').send(defaultEntity);
            const secondEntity = await request(app).post('/api/instances/entities').send(defaultEntity);

            // Mock rel template response
            mock.onGet(`${relationshipManager.url}${relationshipManager.getByIdRoute}/${relTemplateId}`).reply(200, {
                _id: relTemplateId,
                name: 'relTest',
                displayName: 'relTest',
                sourceEntityId: unknownId,
                destinationEntityId: unknownId,
                createdAt: mockDateStr,
                updatedAt: mockDateStr,
                __v: 0,
            });

            const relationship = await request(app).post('/api/instances/relationships').send({
                templateId: relTemplateId,
                properties: defaultProperties,
                sourceEntityId: firstEntity.body.properties._id,
                destinationEntityId: secondEntity.body.properties._id,
            });

            expect(relationship.statusCode).toBe(400);
            expect(relationship.body.type).toEqual('TemplateValidationError');
            expect(relationship.body.message).toEqual(`Relationship template source/destination id does not match entity source/destination id.`);
        });
    });

    describe('Tests to perform after relationship is created', () => {
        let entityId: string;
        let relId: string;

        beforeEach(async () => {
            const { body: entityBody } = await request(app).post('/api/instances/entities').send(defaultEntity);

            entityId = entityBody.properties._id;

            // Create second entities
            const secondEntity = await request(app).post('/api/instances/entities').send(defaultEntity);

            // Create relationship between two entities
            const { body: relBody } = await request(app).post('/api/instances/relationships').send({
                templateId: defaultRelationshipTemplateId,
                properties: defaultProperties,
                sourceEntityId: entityId,
                destinationEntityId: secondEntity.body.properties._id,
            });

            relId = relBody.properties._id;
        });

        describe('GET /api/instances/relationships/:id', () => {
            it('Should get a new relationship', async () => {
                const relationship = await request(app).get(`/api/instances/relationships/${relId}`);

                expect(relationship.body.templateId).toStrictEqual(defaultRelationshipTemplateId);
                expect(relationship.body.properties).toEqual(expect.objectContaining(defaultProperties));
            });

            it('Should fail to get an existing relationship', async () => {
                const relationship = await request(app).get(`/api/instances/relationships/${unknownId}`);

                expect(relationship.statusCode).toBe(404);
                expect(relationship.body.type).toEqual('NotFound');
                expect(relationship.body.message).toEqual(`[NEO4J] relationship "${unknownId}" not found`);
            });
        });

        describe('PUT /api/instances/relationships/:id', () => {
            it('Should update a new relationship', async () => {
                const relationship = await request(app)
                    .put(`/api/instances/relationships/${relId}`)
                    .send({ properties: { testProp: 'newTestProp' } });

                expect(relationship.body.templateId).toStrictEqual(defaultRelationshipTemplateId);
                expect(relationship.body.properties).toEqual(expect.objectContaining({ testProp: 'newTestProp' }));
            });

            it('Should fail to update an existing relationship', async () => {
                const relationship = await request(app)
                    .put(`/api/instances/relationships/${unknownId}`)
                    .send({ properties: { testProp: 'newTestProp' } });

                expect(relationship.statusCode).toBe(404);
                expect(relationship.body.type).toEqual('NotFound');
                expect(relationship.body.message).toEqual(`[NEO4J] relationship "${unknownId}" not found`);
            });
        });

        describe('DELETE /api/instances/relationships/:id', () => {
            it('Should delete an existing relationship', async () => {
                await request(app).delete(`/api/instances/relationships/${relId}`);
            });

            it('Should fail to delete an existing relationship', async () => {
                const relationship = await request(app).put(`/api/instances/relationships/${unknownId}`);

                expect(relationship.statusCode).toBe(404);
                expect(relationship.body.type).toEqual('NotFound');
                expect(relationship.body.message).toEqual(`[NEO4J] relationship "${unknownId}" not found`);
            });
        });
    });
});
