import * as Joi from 'joi';
import { MongoIdSchema } from '../../utils/joi';

const iFrameSchema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    categoryIds: Joi.array().items(Joi.string()).required(),
    description: Joi.string(),
    apiToken: Joi.string(),
    height: Joi.number().default(100),
    width: Joi.number().default(100),
    icon: Joi.object(),
    placeInSideBar: Joi.boolean(),
});

// GET /api/iFrames/externalSite/:iFrameId
export const getExternalSiteByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// GET /api/iFrames/:iFrameId
export const getIFrameByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// POST /api/iFrames
export const createIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {},
});

// DELETE /api/iFrames/:iFrameId
export const deleteIFrameSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// PUT /api/categories
export const updateIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// POST /api/iFrames/search
export const searchIFramesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        limit: Joi.number().integer().min(0).default(0),
        step: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
