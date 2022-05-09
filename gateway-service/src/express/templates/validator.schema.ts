import * as Joi from 'joi';
import { MongoIdSchema, fileSchema, ColorSchema } from '../../utils/joi';

// GET /api/templates/categories/
// GET /api/templates/categories?search=name
export const getCategoriesSchema = Joi.object({
    query: { search: Joi.string() },
    body: {},
    params: {},
});

// POST /api/templates/categories
export const createCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        color: ColorSchema.required(),
    },
    params: {},
    file: fileSchema,
});

// DELETE /api/templates/categories/:categoryId
export const deleteCategorySchema = Joi.object({
    query: {},
    body: {},
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// PUT /api/templates/categories
export const updateCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        file: Joi.allow(null),
        color: ColorSchema,
    },
    params: {
        categoryId: MongoIdSchema.required(),
    },
    file: fileSchema,
});

// DELETE /api/templates/entities/:templateId
export const deleteEntityTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { templateId: MongoIdSchema.required() },
});

// POST api/entities/templates
export const createEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        category: Joi.string().required(),
        disabled: Joi.boolean().default(false),
        properties: Joi.string().required(),
    },
    query: {},
    params: {},
    file: fileSchema,
});

// PUT /api/templates/entities/:templateId
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        category: Joi.string(),
        disabled: Joi.boolean(),
        properties: Joi.string(),
        file: Joi.allow(null),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
    file: fileSchema,
});

// POST /api/templates/relationship
export const createRelationshipTemplateRequestSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        sourceEntityId: MongoIdSchema.required(),
        destinationEntityId: MongoIdSchema.required(),
    },
    query: {},
    params: {},
});

// PUT /api/templates/relationship/:templateId
export const updateRelationshipTemplateByIdRequestSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        sourceEntityId: MongoIdSchema,
        destinationEntityId: MongoIdSchema,
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// DELETE /api/templates/relationship
export const deleteRelationshipTemplateByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// GET /api/templates/relationship?search=value
export const getRelationshipTemplatesRequestSchema = Joi.object({
    body: {},
    query: {
        search: Joi.string(),
        sourceEntityIds: Joi.array().items(MongoIdSchema),
        destinationEntityIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
