import { ICategory, IEntityTemplate } from '@microservices/shared';
import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import request from 'supertest';
import CategoryManager from '../src/express/category/manager';
import categoryModel from '../src/express/category/model';
import EntityTemplateManager from '../src/express/entityTemplate/manager';
import EntityTemplateModel from '../src/express/entityTemplate/model';
import RelationshipTemplateManager from '../src/express/relationshipTemplate/manager';
import Server from '../src/express/server';

jest.mock('../src/relationshipTemplateManager');
const relationshipTemplateManagerMocked = jest.mocked(RelationshipTemplateManager, { shallow: true });

const { OK: okStatus, BAD_REQUEST: badRequest, NOT_FOUND: notFoundStatus, FORBIDDEN: forbiddenStatus } = StatusCodes;

const testUrl = 'mongodb://localhost:27017/test';

const deleteAllCollections = async () => {
    await categoryModel.deleteMany({});
    await EntityTemplateModel.deleteMany({});
};
const mongoId = '61e0106831e8332468e7190b';
const entityTemplateDefaultData: Omit<IEntityTemplate, 'category' | 'iconFileId'> = {
    name: 'test',
    displayName: 'בדיקה',
    disabled: false,
    properties: {
        type: 'object',
        properties: {
            a: { type: 'number', title: 'א' },
        },
    },
};

const categoryDefaultData: Omit<ICategory, 'iconFileId'> = { name: 'category', displayName: 'שם', color: '#FFFFFF' };

describe('Router Tests', () => {
    let app: Express;

    beforeAll(async () => {
        await mongoose.connect(testUrl);
        await deleteAllCollections();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        app = Server.createExpressApp();
        jest.resetAllMocks();
    });

    afterEach(async () => {
        await deleteAllCollections();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(okStatus);
            expect(response.text).toBe('alive');
        });
    });

    describe('invalid route', () => {
        it('should return 404', () => {
            return request(app).get('/unknownRoute').expect(notFoundStatus);
        });
    });

    describe('api/entities/templates', () => {
        describe('POST /', () => {
            it('should fail with status code 400 - validation missing fields', async () => {
                const entityTemplateData = { name: 'test', displayName: 'בדיקה', disabled: false };
                const response = await request(app).post('/api/entities/templates').send(entityTemplateData);
                expect(response.status).toBe(badRequest);
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
                expect(response.status).toBe(badRequest);
                expect(JSON.parse(response.text).type).toBe('ValidationError');
            });

            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app)
                    .post('/api/entities/templates')
                    .send({ ...entityTemplateDefaultData, category: mongoId });
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should create entity template', async () => {
                const category = await CategoryManager.createCategory(categoryDefaultData);
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
                expect(response.status).toBe(okStatus);
            });
        });

        describe('GET /', () => {
            it('should return empty array with status code 200 ', async () => {
                const response = await request(app).get(`/api/entities/templates`).query({ search: 'בדיקה' });
                expect(response.status).toBe(okStatus);
                expect(response.body).toStrictEqual([]);
            });

            it('should return entity template with status code 200', async () => {
                const category = await CategoryManager.createCategory(categoryDefaultData);
                await EntityTemplateManager.createTemplate({ ...entityTemplateDefaultData, category: category._id });
                const response = await request(app).get(`/api/entities/templates`).query({ search: entityTemplateDefaultData.name });
                expect(response.status).toBe(okStatus);
            });
        });

        describe('GET /:templateId', () => {
            it('should fail with status code 404 - entity template not found', async () => {
                const response = await request(app).get(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should find entity template with status code 200', async () => {
                const category = await CategoryManager.createCategory(categoryDefaultData);
                const entityTemplate = await EntityTemplateManager.createTemplate({ ...entityTemplateDefaultData, category: category._id });
                const response = await request(app).get(`/api/entities/templates/${entityTemplate._id}`);
                expect(response.status).toBe(okStatus);
            });
        });

        describe('DELETE /:templateId', () => {
            it('should fail with error 404 - entity template not found', async () => {
                relationshipTemplateManagerMocked.getRelationshipTemplates.mockResolvedValueOnce([]);
                relationshipTemplateManagerMocked.getRelationshipTemplates.mockResolvedValueOnce([]);

                const response = await request(app).delete(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should delete entity template with status code 200', async () => {
                const category = await CategoryManager.createCategory(categoryDefaultData);
                const entityTemplate = await EntityTemplateManager.createTemplate({ ...entityTemplateDefaultData, category: category._id });

                relationshipTemplateManagerMocked.getRelationshipTemplates.mockResolvedValueOnce([]);
                relationshipTemplateManagerMocked.getRelationshipTemplates.mockResolvedValueOnce([]);

                const response = await request(app).delete(`/api/entities/templates/${entityTemplate._id}`);
                expect(response.status).toBe(okStatus);
            });
        });

        describe('PUT /:templateId', () => {
            it('should fail with status code 404 - entity template not found', async () => {
                const response = await request(app).put(`/api/entities/templates/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Entity Template not found');
            });

            it('should update entity template with status code 200', async () => {
                const category = await CategoryManager.createCategory(categoryDefaultData);
                const entityTemplate = await EntityTemplateManager.createTemplate({ ...entityTemplateDefaultData, category: category._id });
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
                expect(response.status).toBe(okStatus);
            });
        });
    });

    describe('/api/categories', () => {
        describe('POST /', () => {
            it('should fail with status code 400 - validation missing fields', async () => {
                const cateoryData = { name: 'test' };
                const response = await request(app).post('/api/categories').send(cateoryData);
                expect(response.status).toBe(badRequest);
                expect(JSON.parse(response.text).type).toBe('ValidationError');
            });

            it('should create category with status code 200', async () => {
                const response = await request(app).post('/api/categories').send(categoryDefaultData);
                expect(response.status).toBe(okStatus);
            });
        });

        describe('GET /:categoryId', () => {
            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app).get(`/api/categories/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should find category with status code 200', async () => {
                const newCategory = await CategoryManager.createCategory(categoryDefaultData);
                const response = await request(app).get(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(okStatus);
            });

            it('should find all categories with status code 200', async () => {
                const categoryData1: Omit<ICategory, 'iconFileId'> = { ...categoryDefaultData, name: 'test', displayName: 'בדיקה' };
                const categoryData2: Omit<ICategory, 'iconFileId'> = { ...categoryDefaultData, name: 'test2', displayName: '2בדיקה' };
                await CategoryManager.createCategory(categoryData1);
                await CategoryManager.createCategory(categoryData2);

                const response = await request(app).get(`/api/categories`);
                expect(response.body).toHaveLength(2);
                expect(response.status).toBe(okStatus);
            });
        });

        describe('DELETE /:categoryId', () => {
            it('should fail with status code 404 - category not found', async () => {
                const response = await request(app).delete(`/api/categories/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should fail with status code 403 - category still has entity templates', async () => {
                const newCategory = await CategoryManager.createCategory(categoryDefaultData);
                await EntityTemplateManager.createTemplate({ ...entityTemplateDefaultData, category: newCategory._id });

                const response = await request(app).delete(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(forbiddenStatus);
                expect(JSON.parse(response.text).message).toBe('category still has entity templates');
            });

            it('should delete category with status code 200', async () => {
                const newCategory = await CategoryManager.createCategory(categoryDefaultData);
                const response = await request(app).delete(`/api/categories/${newCategory._id}`);
                expect(response.status).toBe(okStatus);
            });
        });

        describe('PUT /:categoryId', () => {
            it('should fail with error 404 - category not found', async () => {
                const response = await request(app).put(`/api/categories/${mongoId}`);
                expect(response.status).toBe(notFoundStatus);
                expect(JSON.parse(response.text).message).toBe('Category not found');
            });

            it('should update category with status code 200', async () => {
                const newCategory = await CategoryManager.createCategory(categoryDefaultData);
                const response = await request(app).put(`/api/categories/${newCategory._id}`).send({ name: 'newName' });
                expect(response.status).toBe(okStatus);
                expect(response.body.name).toBe('newName');
            });
        });
    });
});
