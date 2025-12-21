import * as Joi from 'joi';
import { ExtendedJoi } from '../../utils/joi';

const iFrameSchema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    categoryIds: ExtendedJoi.stringToArray(),
    iconFileId: Joi.string().allow(null),
    placeInSideBar: ExtendedJoi.boolean(),
});

// GET /api/iframes/:iFrameId
export const getIFrameByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// POST /api/iframes
export const createIFrameSchema = Joi.object({
    query: {
        toDashboard: Joi.bool(),
    },
    body: iFrameSchema,
    params: {},
    file: iconFileSchema,
});

// DELETE /api/iframes/:iFrameId
export const deleteIFrameSchema = Joi.object({
    query: {
        deleteReferenceDashboardItems: Joi.bool().optional().default(false),
    },
    body: {},
    params: {
        iFrameId: MongoIdSchema.required(),
    },
});

// PUT /api/iframes
export const updateIFrameSchema = Joi.object({
    query: {},
    body: iFrameSchema,
    params: {
        iFrameId: MongoIdSchema.required(),
    },
    file: iconFileSchema,
});

// POST /api/iframes/search
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
