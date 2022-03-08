import * as Joi from 'joi';
import { MongoIdSchema } from '../../utils/joi';

// GET /api/relationship/templates/:templateId
export const getTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/relationship/templates
export const createTemplateRequestSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        sourceEntityId: MongoIdSchema.required(),
        destinationEntityId: MongoIdSchema.required(),
    },
    query: {},
    params: {},
});

// PUT /api/relationship/templates/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
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

// DELETE /api/relationship/templates
export const deleteTemplateByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// GET /api/relationship/templates?search=value
export const getTemplatesRequestSchema = Joi.object({
    body: {},
    query: {
        search: Joi.string(),
        sourceEntityId: MongoIdSchema,
        destinationEntityId: MongoIdSchema,
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
