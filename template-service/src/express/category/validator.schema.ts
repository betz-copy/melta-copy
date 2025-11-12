import { ColorSchema, MongoIdSchema, variableNameValidation } from '@microservices/shared';
import Joi from 'joi';

// GET /api/categories/:categoryId
export const getCategoryByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// GET /api/categories/
// GET /api/categories?search=name
export const getCategoriesSchema = Joi.object({
    query: { search: Joi.string() },
    body: {},
    params: {},
});

// POST /api/categories
export const createCategorySchema = Joi.object({
    query: {},
    body: {
        name: variableNameValidation.required(),
        displayName: Joi.string().required(),
        color: ColorSchema.required(),
        iconFileId: Joi.string().allow(null),
    },
    params: {},
});

// DELETE /api/categories/:categoryId
export const deleteCategorySchema = Joi.object({
    query: {},
    body: {},
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// PUT /api/categories
export const updateCategorySchema = Joi.object({
    query: {},
    body: {
        name: variableNameValidation,
        displayName: Joi.string(),
        color: ColorSchema,
        iconFileId: Joi.string().allow(null),
    },
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// PATCH /api/categories/templatesOrder/:templateId
export const changeTemplatesOrderSchema = Joi.object({
    query: {},
    body: {
        newCategoryId: MongoIdSchema.required(),
        srcCategoryId: MongoIdSchema.required(),
        newIndex: Joi.number().required().min(0),
    },
    params: {
        templateId: MongoIdSchema.required(),
    },
});
