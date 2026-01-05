import { Status } from '@packages/process';
import { MongoIdSchema } from '@packages/utils';
import * as Joi from 'joi';

// GET /api/processes/instances/:id
export const getStepByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// GET /api/processes/instances/:id/template
export const getTemplateByInstanceIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PATCH api/processes/instances/steps/:id
export const updateStepSchema = Joi.object({
    body: Joi.object({
        processId: MongoIdSchema.required(),
        comments: Joi.string(),
        properties: Joi.object(),
        statusReview: Joi.object({
            status: Joi.string()
                .valid(...Object.values(Status))
                .required(),
            reviewerId: Joi.string().required(),
        }),
        userId: Joi.string(),
    }).or('statusReview', 'properties', 'comments'),
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});
