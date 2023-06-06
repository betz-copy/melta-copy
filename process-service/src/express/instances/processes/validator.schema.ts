import * as Joi from 'joi';
import { updateAndCreateStepsSchema, MongoIdSchema, updateStatusPropertiesSchema } from '../../../utils/joi';
import { Status } from './interface';

// GET /api/processes/instances/:processId
export const getInstanceByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/processes/instances
export const createInstanceRequestSchema = Joi.object({
    body: {
        templateId: MongoIdSchema.required(),
        name: Joi.string().required(),
        details: Joi.object().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        steps: updateAndCreateStepsSchema.required(),
    },
    query: {},
    params: {},
});

// PUT /api/processes/instances/:processId
export const updateInstanceByIdRequestSchema = Joi.object({
    body: {
        details: Joi.object(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        name: Joi.string(),
        steps: updateAndCreateStepsSchema,
        status: Joi.string().valid(...Object.values(Status)),
        reviewerId: updateStatusPropertiesSchema,
        summaryDetails: Joi.object(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// DELETE /api/processes/instances/:processId
export const deleteInstanceByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/processes/instances/search
export const searchInstanceRequestSchema = Joi.object({
    query: {},
    body: {
        name: Joi.string(),
        templateIds: Joi.array().items(MongoIdSchema),
        ids: Joi.array().items(MongoIdSchema),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.string().valid(...Object.values(Status)),
        reviewerId: MongoIdSchema,
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
