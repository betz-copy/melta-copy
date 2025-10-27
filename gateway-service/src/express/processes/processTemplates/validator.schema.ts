import { iconFileSchema, MongoIdSchema } from '@microservices/shared';
import Joi from 'joi';
import { ExtendedJoi } from '../../../utils/joi';

// GET /api/processes/templates
export const getTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/processes/templates
export const createProcessTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        details: ExtendedJoi.stringToObject().required(),
        steps: ExtendedJoi.stringToArray().required(),
    },
    query: {},
    params: {},
    files: Joi.array().items(iconFileSchema),
});

// PUT /api/processes/templates/:id
export const updateProcessTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        details: ExtendedJoi.stringToObject().required(),
        steps: ExtendedJoi.stringToArray().required(),
    },
    query: {},
    params: { id: MongoIdSchema.required() },
    files: Joi.array().items(iconFileSchema),
});

// DELETE /api/processes/templates/:id
export const deleteProcessTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { id: MongoIdSchema.required() },
});

// POST /api/templates/process/search
export const searchProcessTemplatesSchema = Joi.object({
    query: {},
    body: {
        displayName: Joi.string(),
        reviewerId: MongoIdSchema,
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(10),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
