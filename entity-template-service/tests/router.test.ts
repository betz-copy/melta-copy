/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { Express } from 'express';
import Server from '../src/express/server';

import CategoryManager from '../src/express/category/manager';
import EntityTemplateManager from '../src/express/entityTemplate/manager';
import categoryModel from '../src/express/category/model';
import EntityTemplateModel from '../src/express/entityTemplate/model';

const testUri = 'mongodb://localhost:27017/test';

const deleteAllCollections = async () => {
    await categoryModel.deleteMany({});
    await EntityTemplateModel.deleteMany({});
};
const mongoId = '61e0106831e8332468e7190b';
const entityTemplateDefaultData = {
    name: 'test',
    displayName: 'בדיקה',
    disabled: false,
    category: mongoId,
    properties: {
        type: 'object',
        properties: {
            a: { type: 'number', title: 'א' },
        },
    },
};

describe('Router Tests', () => {
    let app: Express;

    beforeAll(async () => {
        await mongoose.connect(testUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
        });
        await deleteAllCollections();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await deleteAllCollections();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(200);
            expect(response.text).toBe('alive');
        });
    });

    describe('invalid route', () => {
        it('should return 404', () => {
            return request(app).get('/unknownRoute').expect(404);
        });
    });

    describe('api/entities/templates', () => {
        describe('POST /', () => {
            it('should fail with status code 400 - validation missing fields', async () => {
                const entityTemplateData = { name: 'test', displayName: 'בדיקה', disabled: false };
                const response = await request(app).post('/api/entities/templates').send(entityTemplateData);
                expect(response.status).toBe(400);
                expect(JSON.parse(response.text).type).toBe('ValidationError');
            });

            it('should fail with status code 400 - validation json schema', async () => {
                const entityTemplateData = {
                    name: 'test',
                    displayName: 'בדיקה',
                    disabled: false,
                    category: mongoId,
                    properties: {
                        type: 'object',
                        properties: {
                            a: { type: 'intger' },
                        },
                    },
                };
                const response = await request(app).post('/api/entities/templates').send(entityTemplateData);
                expect(response.status).toBe(400);
                expect(JSON.parse(response.text).type).toBe('ValidationError');
            });

            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app).post('/api/entities/templates').send(entityTemplateDefaultData);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should create entity template', async () => {
                const category = await CategoryManager.createCategory({ name: 'category', displayName: 'שם' });
                const entityTemplateData = {
                    name: 'test',
                    displayName: 'בדיקה',
                    disabled: false,
                    category: category._id,
                    properties: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', title: 'א' },
                        },
                    },
                };
                const response = await request(app).post('/api/entities/templates').send(entityTemplateData);
                expect(response.status).toBe(200);
            });
        });

        describe('GET /', () => {
            it('should return empty array with status code 200 ', async () => {
                const response = await request(app).get(`/api/entities/templates`).query({ search: 'בדיקה' });
                expect(response.status).toBe(200);
                expect(response.body).toStrictEqual([]);
            });

            it('should return entity template with status code 200', async () => {
                await EntityTemplateManager.createTemplate(entityTemplateDefaultData);
                const response = await request(app).get(`/api/entities/templates`).query({ search: 'בדיקה' });
                expect(response.status).toBe(200);
            });
        });

        describe('GET /:templateId', () => {
            it('should fail with status code 404 - entity template not found', async () => {
                const response = await request(app).get(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should find entity template with status code 200', async () => {
                const entityTemplate = await EntityTemplateManager.createTemplate(entityTemplateDefaultData);
                const response = await request(app).get(`/api/entities/templates/${entityTemplate._id}`);
                expect(response.status).toBe(200);
            });
        });

        describe('DELETE /:templateId', () => {
            it('should fail with error 404 - entity template not found', async () => {
                const response = await request(app).delete(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should delete entity template with status code 200', async () => {
                const entityTemplate = await EntityTemplateManager.createTemplate(entityTemplateDefaultData);
                const response = await request(app).delete(`/api/entities/templates/${entityTemplate._id}`);
                expect(response.status).toBe(200);
            });
        });

        describe('PUT /:templateId', () => {
            it('should fail with status code 404 - entity template not found', async () => {
                const response = await request(app).put(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should update entity template with status code 200', async () => {
                const entityTemplate = await EntityTemplateManager.createTemplate(entityTemplateDefaultData);
                const response = await request(app)
                    .put(`/api/entities/templates/${entityTemplate._id}`)
                    .send({
                        properties: {
                            type: 'object',
                            properties: {
                                newField: { type: 'number', title: 'newFieldTitle' },
                            },
                        },
                    });
                expect(response.status).toBe(200);
            });
        });
    });

    describe('/api/categories', () => {
        describe('POST /', () => {
            it('should fail with status code 400 - validation missing fields', async () => {
                const cateoryData = { name: 'test' };
                const response = await request(app).post('/api/categories').send(cateoryData);
                expect(response.status).toBe(400);
                expect(JSON.parse(response.text).type).toBe('ValidationError');
            });

            it('should create category with status code 200', async () => {
                const cateoryData = { name: 'test', displayName: 'בדיקה' };
                const response = await request(app).post('/api/categories').send(cateoryData);
                expect(response.status).toBe(200);
            });
        });

        describe('GET /:categoryId', () => {
            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app).get(`/api/categories/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should find category with status code 200', async () => {
                const cateoryData = { name: 'test', displayName: 'בדיקה' };
                const newCategory = await CategoryManager.createCategory(cateoryData);
                const response = await request(app).get(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(200);
            });

            it('should find all categories with status code 200', async () => {
                await CategoryManager.createCategory({ name: 'test', displayName: 'בדיקה' });
                await CategoryManager.createCategory({ name: 'test2', displayName: '2בדיקה' });

                const response = await request(app).get(`/api/categories`);
                expect(response.body).toHaveLength(2);
                expect(response.status).toBe(200);
            });
        });

        describe('DELETE /:categoryId', () => {
            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app).delete(`/api/categories/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should fail with status code 400 - cannot delete category', async () => {
                const cateoryData = { name: 'test', displayName: 'בדיקה' };
                const newCategory = await CategoryManager.createCategory(cateoryData);
                const entityTemplateData = {
                    name: 'test',
                    displayName: 'בדיקה',
                    disabled: false,
                    category: newCategory._id,
                    properties: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', title: 'א' },
                        },
                    },
                };
                await EntityTemplateManager.createTemplate(entityTemplateData);
                const response = await request(app).delete(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(400);
                expect(JSON.parse(response.text).message).toBe('cannot delete category');
            });

            it('should delete category with status code 200', async () => {
                const cateoryData = { name: 'test', displayName: 'בדיקה' };
                const newCategory = await CategoryManager.createCategory(cateoryData);
                const response = await request(app).delete(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(200);
            });
        });

        describe('PUT /:categoryId', () => {
            it('should fail with error 404 - category not found', async () => {
                const response = await request(app).put(`/api/categories/${mongoId}`);
                expect(response.status).toBe(404);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should update category with status code 200', async () => {
                const cateoryData = { name: 'test', displayName: 'בדיקה' };
                const newCategory = await CategoryManager.createCategory(cateoryData);
                const response = await request(app).put(`/api/categories/${newCategory._id}`).send({ name: 'newName' });
                expect(response.status).toBe(200);
                expect(response.body.name).toBe('newName');
            });
        });
    });
});
