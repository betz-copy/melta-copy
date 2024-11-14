import * as Joi from 'joi';
import { Status } from '@microservices/shared/src/interfaces/process/instances/process';
import { MongoIdSchema } from '../../../utils/joi';

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
    }).or('statusReview', 'properties', 'comments'),
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});
