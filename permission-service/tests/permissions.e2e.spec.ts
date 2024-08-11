/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import Server from '../src/express/server';
import config from '../src/config';
import { StatusCodes } from 'http-status-codes';
// import { sleep } from '../src/utils';

jest.setTimeout(30000);

console.log = () => {};
console.debug = () => {};
console.error = () => {};

const fakeObjectId = '507f1f77bcf86cd799439011';
const fakeObjectId2 = '507f1f77bcf86cd795443901';

const { mongo } = config;
const { OK: okStatus, NOT_FOUND: NotFoundStatus, BAD_REQUEST: BadRequestStatus } = StatusCodes;

const initializeMongo = async () => {
    await mongoose.connect(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
};

const removeAllCollections = async () => {
    const collections = Object.keys(mongoose.connection.collections);

    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany({});
    }
};

describe('e2e permissions tests', () => {
    let app: Express;

    beforeAll(async () => {
        await initializeMongo();

        app = Server.createExpressApp();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    afterEach(async () => {
        await removeAllCollections();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(okStatus);
            expect(response.text).toBe('alive');
        });
    });

    describe('/unknownRoute', () => {
        it('should return status code 404', () => {
            return request(app).get('/unknownRoute').expect(NotFoundStatus);
        });
    });

    describe('/api/permissions', () => {
        /* POST */
        describe('POST /api/permissions', () => {
            it('should fail validation for unknown fields', () => {
                return request(app).post('/api/permissions').send({ test: 'a' }).expect(BadRequestStatus);
            });

            it('should create permission', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const {
                    body: { _id: createdId },
                } = await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const getResponse = await request(app).get(`/api/permissions/${createdId}`).expect(okStatus);
                expect(getResponse.body).toEqual(expect.objectContaining(permissionData));
            });

            it('should fail creating the same permission twice', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(permissionData).expect(BadRequestStatus);
            });

            it('should fail creating permission with category: "all" after there is already permission with the same settings exists', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const permission2Data = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'All',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(permission2Data).expect(BadRequestStatus);
            });

            it('should fail creating permission when there is already permission with category: all and the same settings', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'All',
                    scopes: ['Read'],
                };

                const permission2Data = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People2',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(permission2Data).expect(BadRequestStatus);
            });

            it('should fail creating permission with same (userId, resourceType, category) twice', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app)
                    .post('/api/permissions')
                    .send({ ...permissionData, scopes: ['Write'] })
                    .expect(BadRequestStatus);
            });
        });

        /* POST Authorization */
        describe('POST /api/permissions/:id/authorization', () => {
            it('should fail validation for unknown fields', () => {
                return request(app).post(`/api/permissions/${fakeObjectId}/authorization`).send({ test: 'a' }).expect(BadRequestStatus);
            });

            it('should fail validation for unknown operation', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['People'],
                    operation: 'UnknownOperation',
                };

                await request(app).post(`/api/permissions/${userId}/authorization`).send(checkAuthorizationData).expect(BadRequestStatus);
            });

            it('should return true', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['People'],
                    operation: 'GET',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: true }));
            });

            it('should return true (category: all) case', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'All',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['People'],
                    operation: 'GET',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: true }));
            });

            it('should return false because of permission doesnt exists', async () => {
                const checkAuthorizationData = {
                    resourceType: 'Permissions',
                    relatedCategories: ['People'],
                    operation: 'GET',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${fakeObjectId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: false }));
            });

            it('should return false because user doesnt have the right scoeps', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['People'],
                    operation: 'POST',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: false }));
            });

            it('should return false because user doesnt have permissions on the wanted resourceType', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Instances',
                    relatedCategories: ['People'],
                    operation: 'GET',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: false }));
            });

            it('should return false because user doesnt have permissions on the wanted category', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['AnotherCategory'],
                    operation: 'GET',
                };

                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: false }));
            });

            it('should return false because user doesnt have permissions on all of the related categories', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };
                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const checkAuthorizationData = {
                    resourceType: 'Templates',
                    relatedCategories: ['People', 'People2'],
                    operation: 'GET',
                };
                const checkAuthorizationResponse = await request(app)
                    .post(`/api/permissions/${userId}/authorization`)
                    .send(checkAuthorizationData)
                    .expect(okStatus);

                expect(checkAuthorizationResponse.body).toEqual(expect.objectContaining({ authorized: false }));
            });
        });

        /* GET */
        describe('GET /api/permissions', () => {
            it('should fail because non empty body', () => {
                return request(app).get('/api/permissions').send({ test: 'asd' }).expect(BadRequestStatus);
            });

            it('should fail permission doesnt exists', () => {
                return request(app).get(`/api/permissions/${fakeObjectId}`).expect(NotFoundStatus);
            });

            it('should get all permissions of user', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const anotherUserPermissionData = {
                    userId: fakeObjectId2,
                    resourceType: 'Instances',
                    category: 'People2',
                    scopes: ['Write'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(anotherUserPermissionData).expect(okStatus);

                const getResponse = await request(app).get(`/api/permissions/?userId=${userId}`).expect(okStatus);

                expect(getResponse.body.length).toEqual(1);
                expect(getResponse.body[0]).toEqual(expect.objectContaining(permissionData));
            });

            it('should get all permissions of resourceType: Templates', async () => {
                const userId = fakeObjectId;

                const permissionData = {
                    userId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const anotherUserPermissionData = {
                    userId,
                    resourceType: 'Instances',
                    category: 'People',
                    scopes: ['Write'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(anotherUserPermissionData).expect(okStatus);

                const getResponse = await request(app).get('/api/permissions/?resourceType=Templates').expect(okStatus);

                expect(getResponse.body.length).toEqual(1);
                expect(getResponse.body[0]).toEqual(expect.objectContaining(permissionData));
            });

            it('should get all permissions of specefic category', async () => {
                const userId = fakeObjectId;

                const firstCategory = 'People';
                const secondCategory = 'Test';

                const permissionData = {
                    userId,
                    resourceType: 'Instances',
                    category: firstCategory,
                    scopes: ['Read'],
                };

                const anotherUserPermissionData = {
                    userId: fakeObjectId2,
                    resourceType: 'Instances',
                    category: secondCategory,
                    scopes: ['Write'],
                };

                await request(app).post('/api/permissions').send(permissionData).expect(okStatus);
                await request(app).post('/api/permissions').send(anotherUserPermissionData).expect(okStatus);

                const getResponse = await request(app).get(`/api/permissions/?category=${firstCategory}`).expect(okStatus);

                expect(getResponse.body.length).toEqual(1);
                expect(getResponse.body[0]).toEqual(expect.objectContaining(permissionData));
            });
        });

        /* DELETE */
        describe('DELETE /api/permissions', () => {
            it("should fail because permissions doesn't exists", () => {
                return request(app).delete(`/api/permissions/${fakeObjectId}`).expect(NotFoundStatus);
            });

            it('should delete created permission', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const {
                    body: { _id: createdId },
                } = await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                await request(app).delete(`/api/permissions/${createdId}`).expect(okStatus);

                const getResponse = await request(app).get('/api/permissions').expect(okStatus);
                expect(getResponse.body.length).toEqual(0);
            });
        });

        /* PUT */
        describe('PUT /api/permissions', () => {
            it('should fail because of missing fields', () => {
                return request(app).put(`/api/permissions/${fakeObjectId}`).send({}).expect(BadRequestStatus);
            });

            it("should fail because permission doesn't exists", () => {
                const updateData = {
                    resourceType: 'Instances',
                };

                return request(app).put(`/api/permissions/${fakeObjectId}`).send(updateData).expect(NotFoundStatus);
            });

            it('should update created permission', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const {
                    body: { _id: createdId },
                } = await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const updateData = {
                    resourceType: 'Instances',
                };

                await request(app).put(`/api/permissions/${createdId}`).send(updateData).expect(okStatus);

                const getResponse = await request(app).get(`/api/permissions/${createdId}`).expect(okStatus);
                expect(getResponse.body).toEqual(expect.objectContaining(updateData));
            });

            it('should fail updating permission category', async () => {
                const permissionData = {
                    userId: fakeObjectId,
                    resourceType: 'Templates',
                    category: 'People',
                    scopes: ['Read'],
                };

                const {
                    body: { _id: createdId },
                } = await request(app).post('/api/permissions').send(permissionData).expect(okStatus);

                const updateData = {
                    category: 'People2',
                };

                await request(app).put(`/api/permissions/${createdId}`).send(updateData).expect(BadRequestStatus);
            });
        });
    });
});
