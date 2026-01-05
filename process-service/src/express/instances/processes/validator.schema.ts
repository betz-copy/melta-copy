import { Status } from '@packages/process';
import { MongoIdSchema } from '@packages/utils';
import * as Joi from 'joi';
import { updateAndCreateStepsSchema } from '../../../utils/joi';

const StatusValues = Object.values(Status);

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
        userId: Joi.string(),
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
        userId: Joi.string(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PUT /api/processes/instances:processId
export const archivedProcessRequestSchema = Joi.object({
    body: {
        archived: Joi.boolean(),
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

/*
 * PATCH /api/processes/instances/deletePropertiesOfTemplate/:templateId
 */
export const deletePropertiesOfTemplateRequestSchema = Joi.object({
    body: {
        removedProperties: Joi.object({
            processProperties: Joi.array().items(Joi.string()),
            stepsProperties: Joi.object(),
        }),
        currentTemplate: Joi.object(),
    },
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

// POST /api/processes/instances/search
export const searchInstanceRequestSchema = Joi.object({
    query: {},
    body: {
        searchText: Joi.string(),
        templateIds: Joi.array().items(MongoIdSchema),
        ids: Joi.array().items(MongoIdSchema),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.array().items(...StatusValues),
        reviewerId: MongoIdSchema,
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        archived: Joi.boolean(),
        isWaitingForMeFilterOn: Joi.boolean(),
        isStepStatusPendeing: Joi.boolean(),
        userId: Joi.string(),
    },
    params: {},
});
