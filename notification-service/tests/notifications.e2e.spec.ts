/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import { INotification, NotificationType } from '../src/express/notifications/interface';
import Server from '../src/express/server';
import { ProcessStatus } from '../src/utils/interfaces/processes';

const { mongo } = config;
const { BAD_REQUEST: badRequestStatus, NOT_FOUND: notFoundStatus, OK: okStatus } = StatusCodes;

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
        await mongoose.connect(mongo.url);
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
            const response = await request(app).get('/isAlive').expect(okStatus);
            expect(response.text).toBe('alive');
        });
    });

    describe('/unknownRoute', () => {
        it('should return status code 404', async () => {
            return request(app).get('/unknownRoute').expect(notFoundStatus);
        });
    });

    describe('/api/notifications', () => {
        describe('GET /api/notifications', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).get('/api/notifications').query({ test: 'test' }).expect(badRequestStatus);
            });

            it('should get all the notifications', async () => {
                const { body: notification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                const { body: notification2 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                const { body: notification3 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachResponse, metadata: { requestId: fakeObjectId3 } })
                    .expect(okStatus);

                const { body } = await request(app).get('/api/notifications').query({ limit: 100 }).expect(okStatus);

                expect(body).toEqual([notification3, notification2, notification1]);
            });

            it('should get all the notifications with specific types', async () => {
                const { body: ruleBreachAlertNotification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                const { body: ruleBreachRequestNotification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                const { body: ruleBreachAlertNotification2 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId3 } })
                    .expect(okStatus);
                const { body: newProcessNotification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.newProcess, metadata: { processId: fakeObjectId } })
                    .expect(okStatus);
                const { body: newProcessNotification2 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.newProcess, metadata: { processId: fakeObjectId2 } })
                    .expect(okStatus);
                const { body: processReviewerUpdateNotification } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId],
                        type: NotificationType.processReviewerUpdate,
                        metadata: { processId: fakeObjectId3, addedStepIds: [fakeObjectId], deletedStepIds: [], unchangedStepIds: [] },
                    })
                    .expect(okStatus);

                const { body: ruleBreachNotifications } = await request(app)
                    .get('/api/notifications')
                    .query({ limit: 100, types: [NotificationType.ruleBreachAlert, NotificationType.ruleBreachRequest] })
                    .expect(okStatus);
                const { body: processesNotifications } = await request(app)
                    .get('/api/notifications')
                    .query({ limit: 100, types: [NotificationType.newProcess, NotificationType.processReviewerUpdate] })
                    .expect(okStatus);

                expect(ruleBreachNotifications).toEqual([ruleBreachAlertNotification2, ruleBreachRequestNotification, ruleBreachAlertNotification1]);
                expect(processesNotifications).toEqual([processReviewerUpdateNotification, newProcessNotification2, newProcessNotification1]);
            });

            it('should get all the notifications of user', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                const { body: notification2 } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId2, fakeObjectId, fakeObjectId3],
                        type: NotificationType.ruleBreachRequest,
                        metadata: { requestId: fakeObjectId2 },
                    })
                    .expect(okStatus);
                const { body: notification3 } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId2, fakeObjectId3],
                        type: NotificationType.ruleBreachResponse,
                        metadata: { requestId: fakeObjectId3 },
                    })
                    .expect(okStatus);

                const { body } = await request(app).get('/api/notifications').query({ limit: 100, viewerId: fakeObjectId3 }).expect(okStatus);

                expect(body).toEqual([notification3, notification2]);
            });

            it('should get notifications with pagination', async () => {
                const notifications: INotification[] = [];

                for (let i = 0; i < 15; i++) {
                    const { body: notification } = await request(app)
                        .post('/api/notifications')
                        .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                        .expect(okStatus);

                    notifications.unshift(notification);
                }

                const { body: body1 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 0 }).expect(okStatus);
                const { body: body2 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 1 }).expect(okStatus);
                const { body: body3 } = await request(app).get(`/api/notifications`).query({ limit: 5, step: 2 }).expect(okStatus);

                expect(body1).toEqual(notifications.slice(0, 5));
                expect(body2).toEqual(notifications.slice(5, 10));
                expect(body3).toEqual(notifications.slice(10, 15));
            });

            it('should get an empty array', async () => {
                const { body } = await request(app).get('/api/notifications').query({ limit: 100 }).expect(okStatus);

                expect(body).toEqual([]);
            });
        });

        describe('GET /api/notifications/:notificationId', () => {
            it('should get a notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);

                const { body } = await request(app).get(`/api/notifications/${notification._id}`).expect(okStatus);

                expect(body).toEqual(notification);
            });

            it('should fail for getting a non-existing notification', async () => {
                return request(app).get(`/api/notification/${fakeObjectId}`).expect(notFoundStatus);
            });
        });

        describe('GET /api/notifications/count', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).get('/api/notifications/count').query({ test: 'test' }).expect(badRequestStatus);
            });

            it('should get notification count', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);

                const { body } = await request(app).get('/api/notifications/count').expect(okStatus);

                expect(body).toEqual(4);
            });

            it('should get zero when there are no notifications', async () => {
                const { body } = await request(app).get('/api/notifications/count').expect(okStatus);

                expect(body).toEqual(0);
            });

            it('should get notification count of user', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);

                const { body } = await request(app).get('/api/notifications/count').query({ viewerId: fakeObjectId2 }).expect(okStatus);

                expect(body).toEqual(3);
            });

            it('should get the notification count of specific type', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId3 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.newProcess, metadata: { processId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.newProcess, metadata: { processId: fakeObjectId2 } })
                    .expect(okStatus);

                const { body: ruleBreachNotificationsCount } = await request(app)
                    .get('/api/notifications/count')
                    .query({ types: [NotificationType.ruleBreachAlert, NotificationType.ruleBreachRequest] })
                    .expect(okStatus);
                const { body: processesNotificationsCount } = await request(app)
                    .get('/api/notifications/count')
                    .query({ types: [NotificationType.newProcess, NotificationType.processReviewerUpdate] })
                    .expect(okStatus);

                expect(ruleBreachNotificationsCount).toEqual(3);
                expect(processesNotificationsCount).toEqual(2);
            });
        });

        describe('POST /api/notifications/group-count', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).post('/api/notifications/group-count').send({ test: 'test' }).expect(badRequestStatus);
            });

            it('should fail validation for missing fields', async () => {
                await request(app).post(`/api/notifications/group-count`).send({}).expect(badRequestStatus);
            });

            it('should get notification group count', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId],
                        type: NotificationType.processStatusUpdate,
                        metadata: { processId: fakeObjectId2, status: ProcessStatus.Approved },
                    })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.newProcess, metadata: { processId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId],
                        type: NotificationType.processReviewerUpdate,
                        metadata: { processId: fakeObjectId3, addedStepIds: [], deletedStepIds: [fakeObjectId], unchangedStepIds: [] },
                    })
                    .expect(okStatus);

                const { body } = await request(app)
                    .post('/api/notifications/group-count')
                    .send({
                        groups: {
                            rules: [NotificationType.ruleBreachAlert, NotificationType.ruleBreachRequest],
                            processes: [NotificationType.newProcess, NotificationType.processStatusUpdate, NotificationType.processReviewerUpdate],
                        },
                    })
                    .expect(okStatus);

                expect(body).toEqual({
                    total: 7,
                    groups: {
                        rules: 4,
                        processes: 3,
                    },
                });
            });

            it('should get zero when there are no notifications', async () => {
                const { body } = await request(app)
                    .post('/api/notifications/group-count')
                    .send({ groups: { test1: [NotificationType.ruleBreachAlert], test2: [NotificationType.newProcess] } })
                    .expect(okStatus);

                expect(body).toEqual({
                    total: 0,
                    groups: {
                        test1: 0,
                        test2: 0,
                    },
                });
            });

            it('should not allow zero types in group', async () => {
                await request(app)
                    .post('/api/notifications/group-count')
                    .send({ groups: { test: [] } })
                    .expect(badRequestStatus);
            });

            it('should get notification count of user', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId2], type: NotificationType.ruleBreachRequest, metadata: { requestId: fakeObjectId2 } })
                    .expect(okStatus);

                const { body } = await request(app)
                    .post('/api/notifications/group-count')
                    .send({
                        groups: { alerts: [NotificationType.ruleBreachAlert], requests: [NotificationType.ruleBreachRequest] },
                        viewerId: fakeObjectId2,
                    })
                    .expect(okStatus);

                expect(body).toEqual({ total: 3, groups: { alerts: 0, requests: 3 } });
            });
        });

        describe('POST /api/notifications', () => {
            it('should fail validation for unknown fields', async () => {
                return request(app).post('/api/notifications').send({ test: 'test' }).expect(badRequestStatus);
            });

            it('should fail validation for missing fields', async () => {
                return request(app).post('/api/notifications').send({ viewers: [] }).expect(badRequestStatus);
            });

            it('should create a new notification', async () => {
                const { body } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                expect(body).toEqual(
                    expect.objectContaining({
                        viewers: [fakeObjectId],
                        type: NotificationType.ruleBreachAlert,
                        metadata: expect.objectContaining({ alertId: fakeObjectId }),
                    }),
                );
            });

            it('should fail validation for non-existing notification type', async () => {
                return request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: 'test', metadata: { alertId: fakeObjectId } })
                    .expect(badRequestStatus);
            });

            it('should not allow incorrect notification metadata', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { requestId: fakeObjectId } })
                    .expect(badRequestStatus);

                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachRequest, metadata: { alertId: fakeObjectId } })
                    .expect(badRequestStatus);

                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachResponse, metadata: { alertId: fakeObjectId } })
                    .expect(badRequestStatus);

                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId],
                        type: NotificationType.newProcess,
                        metadata: { processId: fakeObjectId, reviewerStepNames: ['test'], previousReviewerStepNames: [] },
                    })
                    .expect(badRequestStatus);

                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId],
                        type: NotificationType.processReviewerUpdate,
                        metadata: { processId: fakeObjectId },
                    })
                    .expect(badRequestStatus);
            });
        });

        describe('POST /api/notifications/:notificationId/seen', () => {
            it('should fail validation for unknown fields', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                await request(app)
                    .post(`/api/notifications/${notification._id}/seen`)
                    .send({ test: 'test', viewerId: fakeObjectId })
                    .expect(badRequestStatus);
            });

            it('should fail validation for missing fields', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                await request(app).post(`/api/notifications/${notification._id}/seen`).send({}).expect(badRequestStatus);
            });

            it('should update a notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId, fakeObjectId2, fakeObjectId3],
                        type: NotificationType.ruleBreachAlert,
                        metadata: { alertId: fakeObjectId },
                    })
                    .expect(okStatus);

                const { body } = await request(app)
                    .post(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId2 })
                    .expect(okStatus);

                expect(body).toEqual(expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId3] }));
            });

            it('should delete a notification with no viewers', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                const { body: request1 } = await request(app)
                    .post(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId })
                    .expect(okStatus);
                const { body: request2 } = await request(app)
                    .post(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId2 })
                    .expect(okStatus);

                expect(request1).toEqual(expect.objectContaining({ viewers: [fakeObjectId2] }));
                expect(request2).toEqual(expect.objectContaining({ viewers: [] }));

                await request(app).get(`/api/notifications/${notification._id}`).expect(notFoundStatus);
            });

            it('should not change the notification', async () => {
                const { body: notification } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                const { body } = await request(app)
                    .post(`/api/notifications/${notification._id}/seen`)
                    .send({ viewerId: fakeObjectId3 })
                    .expect(okStatus);

                expect(body).toEqual(expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId2] }));
            });
        });

        describe('POST /api/notifications/seen', () => {
            it('should fail validation for unknown fields', async () => {
                await request(app).post(`/api/notifications/seen`).send({ test: 'test', viewerId: fakeObjectId }).expect(badRequestStatus);
            });

            it('should fail validation for missing fields', async () => {
                await request(app).post(`/api/notifications/seen`).send({}).expect(badRequestStatus);
            });

            it('should update notifications', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId, fakeObjectId2, fakeObjectId3],
                        type: NotificationType.ruleBreachAlert,
                        metadata: { alertId: fakeObjectId },
                    })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId2, fakeObjectId, fakeObjectId3],
                        type: NotificationType.ruleBreachAlert,
                        metadata: { alertId: fakeObjectId },
                    })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId3, fakeObjectId2, fakeObjectId],
                        type: NotificationType.ruleBreachAlert,
                        metadata: { alertId: fakeObjectId },
                    })
                    .expect(okStatus);

                const { body } = await request(app).post(`/api/notifications/seen`).send({ viewerId: fakeObjectId2 }).expect(okStatus);

                expect(body).toEqual([
                    expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId3] }),
                    expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId3] }),
                    expect.objectContaining({ viewers: [fakeObjectId3, fakeObjectId] }),
                ]);
            });

            it('should delete notifications with no viewers', async () => {
                const { body: notification1 } = await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                const { body: notification2 } = await request(app)
                    .post('/api/notifications')
                    .send({
                        viewers: [fakeObjectId, fakeObjectId2, fakeObjectId3],
                        type: NotificationType.ruleBreachAlert,
                        metadata: { alertId: fakeObjectId },
                    })
                    .expect(okStatus);

                const { body: request1 } = await request(app).post(`/api/notifications/seen`).send({ viewerId: fakeObjectId }).expect(okStatus);
                const { body: request2 } = await request(app).post(`/api/notifications/seen`).send({ viewerId: fakeObjectId2 }).expect(okStatus);

                expect(request1).toEqual([
                    expect.objectContaining({ viewers: [fakeObjectId2] }),
                    expect.objectContaining({ viewers: [fakeObjectId2, fakeObjectId3] }),
                ]);
                expect(request2).toEqual([expect.objectContaining({ viewers: [] }), expect.objectContaining({ viewers: [fakeObjectId3] })]);

                await request(app).get(`/api/notifications/${notification1._id}`).expect(notFoundStatus);
                await request(app).get(`/api/notifications/${notification2._id}`).expect(okStatus);

                const { body: request3 } = await request(app).post(`/api/notifications/seen`).send({ viewerId: fakeObjectId3 }).expect(okStatus);

                expect(request3).toEqual([expect.objectContaining({ viewers: [] })]);

                await request(app).get(`/api/notifications/${notification2._id}`).expect(notFoundStatus);
            });

            it('should not change notifications', async () => {
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId, fakeObjectId2], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);
                await request(app)
                    .post('/api/notifications')
                    .send({ viewers: [fakeObjectId], type: NotificationType.ruleBreachAlert, metadata: { alertId: fakeObjectId } })
                    .expect(okStatus);

                const { body } = await request(app).post(`/api/notifications/seen`).send({ viewerId: fakeObjectId3 }).expect(okStatus);

                expect(body).toEqual([
                    expect.objectContaining({ viewers: [fakeObjectId, fakeObjectId2] }),
                    expect.objectContaining({ viewers: [fakeObjectId] }),
                ]);
            });
        });
    });
});
