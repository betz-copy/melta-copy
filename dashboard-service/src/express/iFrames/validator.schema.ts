import { iconFileSchema, MongoIdSchema } from '@microservices/shared';
import * as Joi from 'joi';

const iFrameSchema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    categoryIds: Joi.array().items(Joi.string()),
    iconFileId: Joi.string().allow(null),
    placeInSideBar: Joi.boolean(),
});

// GET /api/dashboard/iframes/:iFrameId
export const getIFrameByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// POST /api/dashboard/iframes
export const createIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {},
    file: iconFileSchema,
});

// DELETE /api/dashboard/iframes/:iFrameId
export const deleteIFrameSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// PUT /api/dashboard/iframes/:iFrameId
export const updateIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {
        iFrameId: MongoIdSchema.required(),
    },
    file: iconFileSchema,
});

// POST /api/dashboard/iframes/search
export const searchIFramesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        ids: Joi.array().items(Joi.string()),
    },
    params: {},
});
