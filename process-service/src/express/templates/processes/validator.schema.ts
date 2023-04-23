import * as Joi from 'joi';
import { MongoIdSchema, updateProcessTemplateBody, createProcessTemplateBody } from '../../../utils/joi';

// GET /api/templates/process/:id
export const getTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/templates/process
export const createTemplateRequestSchema = Joi.object({
    body: createProcessTemplateBody,
    query: {},
    params: {},
});

// PUT /api/templates/process/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
    body: updateProcessTemplateBody,
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// DELETE /api/templates/process/:templateId
export const deleteTemplateByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/templates/process/search
export const searchTemplateRequestSchema = Joi.object({
    query: {},
    body: {
        displayName: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(10),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
