import { MongoIdSchema } from '@packages/utils';
import * as Joi from 'joi';
import { createProcessTemplateBody, updateProcessTemplateBody } from '../../../utils/joi';

// GET /api/processes/templates/search-by-reviewer/:reviewerId
export const searchTemplatesByReviewerIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        reviewerId: MongoIdSchema.required(),
    },
});
// GET /api/processes/templates/:id
export const getTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/processes/templates
export const createTemplateRequestSchema = Joi.object({
    body: createProcessTemplateBody,
    query: {},
    params: {},
});

// PUT /api/processes/templates/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
    body: updateProcessTemplateBody,
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// DELETE /api/processes/templates/:templateId
export const deleteTemplateByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/processes/templates/search
export const searchTemplateRequestSchema = Joi.object({
    query: {},
    body: {
        displayName: Joi.string(),
        reviewerId: MongoIdSchema,
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(1).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
