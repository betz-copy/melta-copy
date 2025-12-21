import { ConfigTypes } from '@packages/workspace-configs';
import Joi from 'joi';

// GET /api/config/all
export const getAllConfigsSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

// GET /api/config/:type
export const getConfigByTypeSchema = Joi.object({
    query: {},
    body: {},
    params: {
        type: Joi.string()
            .valid(...Object.values(ConfigTypes))
            .required(),
    },
});

// PUT /api/config/:configId
export const updateCategoryOrderConfigSchema = Joi.object({
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
export const createCategoryOrderConfigSchema = Joi.object({
    query: {},
    body: {
        type: Joi.string()
            .valid(...Object.values(ConfigTypes))
            .required(),
        order: Joi.array().items(MongoIdSchema),
    },
    params: {},
});
