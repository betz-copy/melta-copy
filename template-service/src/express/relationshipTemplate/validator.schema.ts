import { MongoIdSchema, variableNameValidation } from '@packages/utils';
import Joi from 'joi';

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
        name: variableNameValidation.required(),
        displayName: Joi.string().required(),
        sourceEntityId: MongoIdSchema.required(),
        destinationEntityId: MongoIdSchema.required(),
        isProperty: Joi.boolean().default(false),
    },
    query: {},
    params: {},
});

// PUT /api/relationship/templates/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
    body: {
        name: variableNameValidation,
        displayName: Joi.string(),
        sourceEntityId: MongoIdSchema,
        destinationEntityId: MongoIdSchema,
        isProperty: Joi.boolean(),
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

// POST /api/relationship/templates/search?search=value
export const searchTemplatesRequestSchema = Joi.object({
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        sourceEntityIds: Joi.array().items(MongoIdSchema),
        destinationEntityIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
});
