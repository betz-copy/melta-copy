import { Status } from '@packages/process';
import * as Joi from 'joi';
import { ExtendedJoi } from '../../../utils/joi';
import { fileSchema, MongoIdSchema } from '@packages/utils';

const StatusValues = Object.values(Status);
// GET /api/processes/instances/:id
export const getProcessInstanceSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

// POST /api/processes/instances
export const createProcessInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        name: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        details: ExtendedJoi.stringToObject().required(),
        steps: ExtendedJoi.stringToObject().required(),
    }),
    query: {},
    params: {},
    files: Joi.array().items(fileSchema),
});

// PUT /api/processes/instances:id
export const updateProcessInstanceSchema = Joi.object({
    body: Joi.object({
        name: Joi.string(),
        details: ExtendedJoi.stringToObject(),
        steps: ExtendedJoi.stringToObject(),
        startDate: Joi.date(),
        endDate: Joi.date(),
    }),
    query: {},
    params: { id: Joi.string().required() },
    files: Joi.array().items(fileSchema),
});

// PATCH /api/processes/instances/status/:id
export const archivedProcessStatusSchema = Joi.object({
    body: Joi.object({
        archived: Joi.boolean(),
    }),
    query: {},
    params: { id: Joi.string().required() },
});

// DELETE /api/processes/instances/:id
export const deleteProcessInstanceSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

// POST /api/templates/process/search
export const searchProcessInstancesSchema = Joi.object({
    query: {},
    body: {
        searchText: Joi.string(),
        templateIds: Joi.array().items(MongoIdSchema),
        ids: Joi.array().items(MongoIdSchema),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.array().items(...StatusValues),
        limit: Joi.number().integer().min(0).default(10),
        skip: Joi.number().integer().min(0).default(0),
        archived: Joi.boolean().default(false),
        isWaitingForMeFilterOn: Joi.boolean(),
        isStepStatusPendeing: Joi.boolean(),
    },
    params: {},
});
