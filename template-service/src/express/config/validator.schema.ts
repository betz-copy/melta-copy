import Joi from 'joi';
import { MongoIdSchema, variableNameValidation } from '../../utils/joi';
import { ConfigTypes } from './interface';

// GET /api/config/all
export const getAllConfigsSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

//GET /api/config/:name
export const getOrderConfigByNameSchema = Joi.object({
    query: {},
    body: {},
    params: {
        configName: variableNameValidation.required(),
    },
});

// PUT /api/config/:configId
export const updateOrderConfigSchema = Joi.object({
    query: {},
    body: {
        newIndex: Joi.number().min(0).required(),
        item: MongoIdSchema.required(),
    },
    params: {
        configId: MongoIdSchema.required(),
    },
});

// POST /api/config
export const createOrderConfigSchema = Joi.object({
    query: {},
    body: {
        name: variableNameValidation.required(),
        type: Joi.string()
            .valid(...Object.values(ConfigTypes))
            .required(),
        order: Joi.array().items(MongoIdSchema),
    },
    params: {},
});
