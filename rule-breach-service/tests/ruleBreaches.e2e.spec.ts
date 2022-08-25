/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { Express } from 'express';

import config from '../src/config';
import Server from '../src/express/server';
import { ActionTypes } from '../src/utils/interfaces/actionMetadata';

const { mongo } = config;

const fakeObjectId = '111111111111111111111111';
const fakeObjectId2 = '222222222222222222222222';
const fakeObjectId3 = '333333333333333333333333';

const removeAllCollections = async () => {
    const collections = Object.keys(mongoose.connection.collections);

    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany({});
    }
};

describe('e2e rule breaches api testing', () => {
    let app: Express;

    beforeAll(async () => {
        await mongoose.connect(mongo.uri);
        app = Server.createExpressApp();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        await removeAllCollections();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(200);
            expect(response.text).toBe('alive');
        });
    });

    describe('/unknownRoute', () => {
        it('should return status code 404', async () => {
            return request(app).get('/unknownRoute').expect(404);
        });
    });

    describe('/api/rule-breaches', () => {
        describe('/alerts', () => {
            // describe('POST /search', () => {});  //TODO

            describe('POST /', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/alerts').send({ test: 'test' }).expect(400);
                });

                it('should fail validation for missing fields', async () => {
                    return request(app).post('/api/rule-breaches/alerts').send({ originUserId: fakeObjectId }).expect(400);
                });

                it('should create a new rule breach alert', async () => {
                    const { body } = await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    expect(body).toEqual(
                        expect.objectContaining({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        }),
                    );
                });

                it('should fail on incorrect action metadata', async () => {
                    return request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.DeleteRelationship,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });

                it('should fail on rule breach alert without broken rules', async () => {
                    return request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });

                it('should fail on incorrect action type', async () => {
                    return request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [],
                            actionType: 'test',
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });
            });

            describe('PATCH /:ruleBreachAlertId/action-metadata', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/alerts').send({ test: 'test' }).expect(400);
                });

                it('should fail validation for missing fields', async () => {
                    return request(app).post('/api/rule-breaches/alerts').send({ actionType: ActionTypes.CreateRelationship }).expect(400);
                });

                it('should update rule breach alert metadata', async () => {
                    const { body: ruleBreachAlert } = await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    const { body } = await request(app)
                        .patch(`/api/rule-breaches/alerts/${ruleBreachAlert._id}/action-metadata`)
                        .send({ actionType: ActionTypes.DeleteRelationship, actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(200);

                    expect(body).toEqual(
                        expect.objectContaining({
                            actionType: ActionTypes.DeleteRelationship,
                            actionMetadata: { relationshipId: fakeObjectId },
                        }),
                    );
                });

                it('should fail for update rule breach alert with incorrect action type', async () => {
                    const { body: ruleBreachAlert } = await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app)
                        .patch(`/api/rule-breaches/alerts/${ruleBreachAlert._id}/action-metadata`)
                        .send({ actionType: 'test', actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(400);
                });

                it('should fail for update rule breach alert with incorrect action metadata', async () => {
                    const { body: ruleBreachAlert } = await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app)
                        .patch(`/api/rule-breaches/alerts/${ruleBreachAlert._id}/action-metadata`)
                        .send({ actionType: ActionTypes.UpdateEntity, actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(400);
                });
            });

            describe('GET /:ruleBreachAlertId', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/alerts').send({ test: 'test' }).expect(400);
                });

                it('should get rule breach alert by id', async () => {
                    await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);
                    const { body: ruleBreachAlert } = await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId2,
                            brokenRules: [{ ruleId: fakeObjectId2, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId2, updatedFields: { name: 'test2' } },
                        })
                        .expect(200);
                    await request(app)
                        .post('/api/rule-breaches/alerts')
                        .send({
                            originUserId: fakeObjectId3,
                            brokenRules: [{ ruleId: fakeObjectId3, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId3, updatedFields: { name: 'test3' } },
                        })
                        .expect(200);

                    const { body } = await request(app).get(`/api/rule-breaches/alerts/${ruleBreachAlert._id}`).expect(200);

                    expect(body).toEqual(ruleBreachAlert);
                });

                it('should fail for getting a non-existing rule breach alert', async () => {
                    return request(app).get(`/api/rule-breaches/alerts/${fakeObjectId}`).expect(404);
                });
            });
        });

        describe('/requests', () => {
            // describe('POST /search', () => {});  //TODO

            describe('POST /', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/requests').send({ test: 'test' }).expect(400);
                });

                it('should fail validation for missing fields', async () => {
                    return request(app).post('/api/rule-breaches/requests').send({ originUserId: fakeObjectId }).expect(400);
                });

                it('should create a new rule breach request', async () => {
                    const { body } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.CreateRelationship,
                            actionMetadata: { relationshipId: fakeObjectId },
                        })
                        .expect(200);

                    expect(body).toEqual(
                        expect.objectContaining({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.CreateRelationship,
                            actionMetadata: { relationshipId: fakeObjectId },
                        }),
                    );
                });

                it('should fail on incorrect action metadata', async () => {
                    return request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.DeleteRelationship,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });

                it('should fail on rule breach request without broken rules', async () => {
                    return request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });

                it('should fail on incorrect action type', async () => {
                    return request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [],
                            actionType: 'test',
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(400);
                });
            });

            describe('PATCH /:ruleBreachRequestId/review', () => {
                it('should fail validation for unknown fields', async () => {
                    const {
                        body: { _id },
                    } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app).patch(`/api/rule-breaches/requests/${_id}/review`).send({ test: 'test' }).expect(400);
                });

                it('should fail validation for missing fields', async () => {
                    const {
                        body: { _id },
                    } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app).patch(`/api/rule-breaches/requests/${_id}/review`).send({ reviewerId: fakeObjectId }).expect(400);
                });

                it('should set rule breach request as approved', async () => {
                    const {
                        body: { _id },
                    } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    const { body } = await request(app)
                        .patch(`/api/rule-breaches/requests/${_id}/review`)
                        .send({ reviewerId: fakeObjectId, approved: true })
                        .expect(200);

                    expect(body).toEqual(expect.objectContaining({ approved: true, reviewerId: fakeObjectId }));
                });
            });

            describe('PATCH /:ruleBreachRequestId/action-metadata', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/requests').send({ test: 'test' }).expect(400);
                });

                it('should fail validation for missing fields', async () => {
                    return request(app).post('/api/rule-breaches/requests').send({ actionType: ActionTypes.CreateRelationship }).expect(400);
                });

                it('should update rule breach request metadata', async () => {
                    const { body: ruleBreachRequest } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    const { body } = await request(app)
                        .patch(`/api/rule-breaches/requests/${ruleBreachRequest._id}/action-metadata`)
                        .send({ actionType: ActionTypes.DeleteRelationship, actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(200);

                    expect(body).toEqual(
                        expect.objectContaining({
                            actionType: ActionTypes.DeleteRelationship,
                            actionMetadata: { relationshipId: fakeObjectId },
                        }),
                    );
                });

                it('should fail for update rule breach request with incorrect action type', async () => {
                    const { body: ruleBreachRequest } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app)
                        .patch(`/api/rule-breaches/requests/${ruleBreachRequest._id}/action-metadata`)
                        .send({ actionType: 'test', actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(400);
                });

                it('should fail for update rule breach request with incorrect action metadata', async () => {
                    const { body: ruleBreachRequest } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);

                    await request(app)
                        .patch(`/api/rule-breaches/requests/${ruleBreachRequest._id}/action-metadata`)
                        .send({ actionType: ActionTypes.UpdateEntity, actionMetadata: { relationshipId: fakeObjectId } })
                        .expect(400);
                });
            });

            describe('GET /:ruleBreachRequestId', () => {
                it('should fail validation for unknown fields', async () => {
                    return request(app).post('/api/rule-breaches/requests').send({ test: 'test' }).expect(400);
                });

                it('should get rule breach request by id', async () => {
                    await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId,
                            brokenRules: [{ ruleId: fakeObjectId, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId, updatedFields: { name: 'test' } },
                        })
                        .expect(200);
                    const { body: ruleBreachRequest } = await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId2,
                            brokenRules: [{ ruleId: fakeObjectId2, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId2, updatedFields: { name: 'test2' } },
                        })
                        .expect(200);
                    await request(app)
                        .post('/api/rule-breaches/requests')
                        .send({
                            originUserId: fakeObjectId3,
                            brokenRules: [{ ruleId: fakeObjectId3, relationshipsIds: [fakeObjectId, fakeObjectId2] }],
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: fakeObjectId3, updatedFields: { name: 'test3' } },
                        })
                        .expect(200);

                    const { body } = await request(app).get(`/api/rule-breaches/requests/${ruleBreachRequest._id}`).expect(200);

                    expect(body).toEqual(ruleBreachRequest);
                });

                it('should fail for getting a non-existing rule breach request', async () => {
                    return request(app).get(`/api/rule-breaches/requests/${fakeObjectId}`).expect(404);
                });
            });
        });
    });
});
