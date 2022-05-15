import * as Joi from 'joi';
import { MongoIdSchema, innerPropertiesSchema } from '../../utils/joi';

// POST /api/entities/templates/search
export const searchEntityTemplatesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
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
        iconFileId: Joi.string().allow(null),
    },
    query: {},
    params: {},
});

// PUT /api/entities/templates/:templateId
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        category: Joi.string(),
        disabled: Joi.boolean(),
        properties: innerPropertiesSchema,
        iconFileId: Joi.string().allow(null),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});
