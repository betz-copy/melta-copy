import * as Joi from 'joi';
import { FilePathSchema, HexColorSchema, MongoIdSchema, WorkspaceNameSchema } from '../../utils/joi';
import { Colors, WorkspaceTypes } from './interface';

const workspaceSchema = Joi.object({
    name: WorkspaceNameSchema,
    displayName: Joi.string().required(),
    path: FilePathSchema.required(),
    type: Joi.string()
        .valid(...Object.values(WorkspaceTypes))
        .required(),
    colors: Joi.object(Object.values(Colors).reduce((acc, color) => ({ ...acc, [color]: HexColorSchema.required() }), {})).required(),
    iconFileId: Joi.string(),
    logoFileId: Joi.string(),
});

// POST /api/workspaces/ids
export const getWorkspaceIds = Joi.object({
    query: {},
    body: {
        type: workspaceSchema.extract('type'),
    },
    params: {},
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

// GET /api/workspaces/:id/ids/hierarchy
export const getWorkspaceHierarchyIdsSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
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
});
