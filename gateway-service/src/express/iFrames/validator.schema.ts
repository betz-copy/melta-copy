import * as Joi from 'joi';
import { ExtendedJoi, iconFileSchema, MongoIdSchema } from '../../utils/joi';

const iFrameSchema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    categoryIds: ExtendedJoi.stringToObject(),
    description: Joi.string(),
    apiToken: Joi.string(),
    iconFileId: Joi.string().allow(null),
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

// PUT /api/iFrames
export const updateIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {
        iFrameId: MongoIdSchema.required(),
    },
    file: iconFileSchema,
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
