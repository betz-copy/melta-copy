/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { config } from '../src/config';
import Server from '../src/express/server';
import { IUser } from '../src/express/users/interface';

const { mongo } = config;

const { OK: okStatus, NOT_FOUND: notFoundStatus } = StatusCodes;

const fakeObjectId = '111111111111111111111111';
const fakeObjectId2 = '222222222222222222222222';
const fakeObjectId3 = '333333333333333333333333';

const userData1: Omit<IUser, '_id'> = {
    fullName: 'a a',
    jobTitle: 'a',
    hierarchy: 'a/a/a/a',
    mail: 'a@gmail.com',
    preferences: {
        darkMode: true,
    },
    externalMetadata: {
        kartoffelId: fakeObjectId,
        digitalIdentitySource: '?',
    },
    permissions: {},
};

const userData2: Omit<IUser, '_id'> = {
    fullName: 'b b',
    jobTitle: 'b',
    hierarchy: 'b/b/b/b',
    mail: 'b@gmail.com',
    preferences: {
        darkMode: false,
    },
    externalMetadata: {
        kartoffelId: fakeObjectId2,
        digitalIdentitySource: '?',
    },
    permissions: {},
};

const userData3: Omit<IUser, '_id'> = {
    fullName: 'c c',
    jobTitle: 'c',
    hierarchy: 'c/c/c/c',
    mail: 'c@gmail.com',
    preferences: {
        darkMode: true,
    },
    externalMetadata: {
        kartoffelId: fakeObjectId3,
        digitalIdentitySource: '?',
    },
    permissions: {},
};

const removeAllCollections = async () => {
    const collections = Object.keys(mongoose.connection.collections);

    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany({});
    }
};

describe('e2e user service api testing', () => {
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

    describe('/api/users', () => {
        describe('GET /api/users/:id', () => {
            it('should get a user', async () => {
                const { body: user } = await request(app).post('/api/users').send(userData1).expect(okStatus);

                const { body } = await request(app).get(`/api/users/${user._id}`).expect(okStatus);

                expect(body).toEqual(user);
            });

            it('should fail for getting a non-existing user', async () => {
                return request(app).get(`/api/users/${fakeObjectId}`).expect(notFoundStatus);
            });
        });
    });
});

// TODO: finish testing the rest of the routes
