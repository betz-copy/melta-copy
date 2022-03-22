import * as Joi from 'joi';
import { MongoIdSchema, fileSchema, innerPropertiesSchema } from '../../utils/joi';

// GET /api/entities/templates?search=name&limit=0&skip=0&category=
export const getEntityTemplatesSchema = Joi.object({
    query: {
        search: Joi.string(),
        categoryId: MongoIdSchema,
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    body: {},
    params: {},
});

// GET /api/entities/templates/:templateId
export const getEntityTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: { templateId: MongoIdSchema.required() },
});

// DELETE /api/entities/templates/:templateId
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
        properties: innerPropertiesSchema.required(),
    },
    query: {},
    params: {},
    file: fileSchema,
});

// PUT /api/entities/templates/:templateId
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        category: Joi.string(),
        disabled: Joi.boolean(),
        properties: innerPropertiesSchema,
        file: Joi.allow(null),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
    file: fileSchema,
});
