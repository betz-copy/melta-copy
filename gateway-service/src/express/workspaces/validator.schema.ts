import Joi from 'joi';
import { ExtendedJoi, FilePathSchema, iconFileSchema, MongoIdSchema } from '../../utils/joi';
import { WorkspaceTypes } from './interface';

const workspaceSchema = Joi.object({
    name: Joi.string().required(),
    path: FilePathSchema.required(),
    type: Joi.string()
        .valid(...Object.values(WorkspaceTypes))
        .required(),
    colors: ExtendedJoi.stringToObject(),
    iconFileId: Joi.string(),
    logoFileId: Joi.string(),
});

// POST /api/workspaces/dir
export const getDirSchema = Joi.object({
    query: {},
    body: {
        path: workspaceSchema.extract('path'),
    },
    params: {},
});

// POST /api/workspaces/file
export const getFileSchema = Joi.object({
    query: {},
    body: {
        path: workspaceSchema.extract('path'),
    },
    params: {},
});

// GET /api/workspaces/:id
export const getByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/workspaces
export const createOneSchema = Joi.object({
    query: {},
    body: workspaceSchema,
    params: {},
    files: Joi.array().items(iconFileSchema),
});

// DELETE /api/workspaces/:id
export const deleteOneSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PUT /api/workspaces/:id
export const updateOneSchema = Joi.object({
    query: {},
    body: workspaceSchema,
    params: {
        id: MongoIdSchema.required(),
    },
    files: Joi.array().items(iconFileSchema),
});
