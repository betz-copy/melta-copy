/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { Express } from 'express';

import config from '../src/config';
import Server from '../src/express/server';
import { INotification } from '../src/express/notifications/interface';

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

describe('e2e notifications api testing', () => {
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

    describe('/api/notifications', () => {
        describe('GET /api/notifications', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).get('/api/notifications').query({ test: 'test' }).expect(400);
            });

            it('should get all the notifications', async () => {
                const { body: notification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);
                const { body: notification2 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachRequest', metadata: { requestId: fakeObjectId2 } })
                    .expect(200);
                const { body: notification3 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachResponse', metadata: { requestId: fakeObjectId3 } })
                    .expect(200);

                const { body } = await request(app).get('/api/notifications').expect(200);

                expect(body).toEqual([notification1, notification2, notification3]);
            });

            it('should get all the notifications of type "ruleBreachAlert"', async () => {
                const { body: notification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachRequest', metadata: { requestId: fakeObjectId2 } })
                    .expect(200);
                const { body: notification3 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { requestId: fakeObjectId3 } })
                    .expect(200);

                const { body } = await request(app).get('/api/notifications').query({ type: 'ruleBreachAlert' }).expect(200);

                expect(body).toEqual([notification1, notification3]);
            });

            it('should get all the notifications of user', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);
                const { body: notification2 } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId2, fakeObjectId, fakeObjectId3],
                        type: 'ruleBreachRequest',
                        metadata: { requestId: fakeObjectId2 },
                    })
                    .expect(200);
                const { body: notification3 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2, fakeObjectId3], type: 'ruleBreachResponse', metadata: { requestId: fakeObjectId3 } })
                    .expect(200);

                const { body } = await request(app).get('/api/notifications').query({ viewerId: fakeObjectId3 }).expect(200);

                expect(body).toEqual([notification2, notification3]);
            });

            it('should get notifications with pagination', async () => {
                const page1Notifications: INotification[] = [];
                const page2Notifications: INotification[] = [];
                const page3Notifications: INotification[] = [];

                for (let i = 0; i < 15; i++) {
                    const { body: notification } = await request(app)
                        .post('/api/notifications')
                        .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                        .expect(200);

                    if (i < 5) {
                        page1Notifications.push(notification);
                    } else if (i < 10) {
                        page2Notifications.push(notification);
                    } else {
                        page3Notifications.push(notification);
                    }
                }

                const { body: body1 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 0 }).expect(200);
                const { body: body2 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 1 }).expect(200);
                const { body: body3 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 2 }).expect(200);

                expect(body1).toEqual(page1Notifications);
                expect(body2).toEqual(page2Notifications);
                expect(body3).toEqual(page3Notifications);
            });

            it('should get an empty array', async () => {
                const { body } = await request(app).get('/api/notifications').expect(200);

                expect(body).toEqual([]);
            });
        });

        describe('GET /api/notifications/:notificationId', () => {
            it('should get a notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: 'ruleBreachRequest', metadata: { alertId: fakeObjectId2 } })
                    .expect(200);

                const { body } = await request(app).get(`/api/notifications/${notification._id}`).expect(200);

                expect(body).toEqual(notification);
            });

            it('should fail for getting a non-existing notification', async () => {
                return request(app).get(`/api/notification/${fakeObjectId}`).expect(404);
            });
        });

        describe('POST /api/notifications', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).post('/api/notifications').send({ test: 'test' }).expect(400);
            });

            it('should fail validation for missing fields', async () => {
                return request(app).post('/api/notifications').send({ viewers: [] }).expect(400);
            });

            it('should create a new notification', async () => {
                const { body } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);

                expect(body).toEqual(
                    expect.objectContaining({
                        viewers: [fakeObjectId],
                        type: 'ruleBreachAlert',
                        metadata: expect.objectContaining({ alertId: fakeObjectId }),
                    }),
                );
            });

            it('should fail validation for non-existing notification type', async () => {
                return request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'test', metadata: { alertId: fakeObjectId } })
                    .expect(400);
            });
        });

        describe('PATCH /api/notifications/:notificationId/seen', () => {
            it('should fail validation for unknown fields', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);

                await request(app).patch(`/api/notifications/${notification._id}/seen`).send({ test: 'test', viewerId: fakeObjectId }).expect(400);
            });

            it('should fail validation for missing fields', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);

                await request(app).patch(`/api/notifications/${notification._id}/seen`).send({}).expect(400);
            });

            it('should update a notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2, fakeObjectId3], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);

                const { body } = await request(app)
                    .patch(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId2 })
                    .expect(200);

                expect(body).toEqual(expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId3] }));
            });

            it('should not change the notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: 'ruleBreachAlert', metadata: { alertId: fakeObjectId } })
                    .expect(200);

                const { body } = await request(app)
                    .patch(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId3 })
                    .expect(200);

                expect(body).toEqual(expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId2] }));
            });
        });
    });
});
