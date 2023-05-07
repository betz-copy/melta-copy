import * as Joi from 'joi';
import { MongoIdSchema } from '../../../utils/joi';
import { Status } from '../processes/interface';

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

// PATCH api/processes/instances/steps/:id/properties
export const updateStepPropertiesSchema = Joi.object({
    body: {
        properties: Joi.object().required(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PATCH api/processes/instances/steps/:id/status
export const updateStepStatusSchema = Joi.object({
    body: {
        status: Joi.string()
            .valid(...Object.values(Status))
            .required(),
        reviewerId: Joi.string().required(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});
