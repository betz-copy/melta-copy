import * as Joi from 'joi';
import { MongoIdSchema } from '../../utils/joi';
import { StepStatus } from './interface';

// GET /api/instances/process/:processId
export const getInstanceByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        processId: MongoIdSchema.required(),
    },
});

// POST /api/instances/process
export const createInstanceRequestSchema = Joi.object({
    body: {
        templateId: MongoIdSchema.required(),
        details: Joi.object().required(),
        steps: Joi.array()
            .items(
                Joi.object({
                    properties: Joi.object().required(),
                    status: Joi.string()
                        .valid(...Object.values(StepStatus))
                        .required(),
                }),
            )
            .required(),
        approvers: Joi.array().items(Joi.string()).required(),
    },
    query: {},
    params: {},
});

// PUT /api/instances/process/:processId
export const updateInstanceByIdRequestSchema = Joi.object({
    body: {
        details: Joi.object(),
        steps: Joi.array().items(
            Joi.object({
                properties: Joi.object(),
                status: Joi.string().valid(...Object.values(StepStatus)),
            }),
        ),
        approvers: Joi.array().items(Joi.string()),
        approverId: Joi.string(),
        approvedAt: Joi.date(),
    },
    query: {},
    params: {},
});

// DELETE /api/instances/process/:processId
export const deleteInstanceByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        processId: MongoIdSchema.required(),
    },
});

// POST /api/instances/process/search
export const searchInstanceRequestSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
