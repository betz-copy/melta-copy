import * as Joi from 'joi';
import { ExtendedJoi, MongoIdSchema, processFileSchema } from '../../../utils/joi';
import { Status } from '../../../externalServices/processService/interfaces/processInstance';

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
    files: Joi.array().items(processFileSchema),
});

// PUT /api/processes/instances:id
export const updateProcessInstanceSchema = Joi.object({
    body: Joi.object({
        name: Joi.string(),
        details: ExtendedJoi.stringToObject(),
        steps: ExtendedJoi.stringToObject(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.string(),
        reviewerId: Joi.string(),
        summaryDetails: ExtendedJoi.stringToObject(),
    }),
    query: {},
    params: { id: Joi.string().required() },
    files: Joi.array().items(processFileSchema),
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
        name: Joi.string(),
        templateIds: Joi.array().items(MongoIdSchema),
        ids: Joi.array().items(MongoIdSchema),
        startDate: Joi.date(),
        endDate: Joi.date(),
        status: Joi.string().valid(...Object.values(Status)),
        limit: Joi.number().integer().min(0).default(10),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
