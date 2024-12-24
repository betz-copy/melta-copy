import Joi from 'joi';
import { ExtendedJoi, FilePathSchema, iconFileSchema, MongoIdSchema, WorkspaceNameSchema } from '../../utils/joi';
import { WorkspaceTypes } from './interface';

const metadataSchema = Joi.object({
    shouldNavigateToEntityPage: Joi.boolean(),
    isDrawerOpen: Joi.boolean(),
    agGrid: Joi.object({
        rowCount: Joi.number(),
        defaultExpandedRowCount: Joi.number(),
        defaultRowHeight: Joi.number(),
        defaultFontSize: Joi.number(),
        infiniteInitialRowCount: Joi.number(),
        defaultExpandedTableHeight: Joi.number(),
    }).optional(),
    mainFontSizes: Joi.object({
        headlineTitleFontSize: Joi.string(),
        headlineSubTitleFontSize: Joi.string(),
    }).optional(),
    smallPreviewHeight: Joi.object({
        number: Joi.string(),
        unit: Joi.string(),
    }).optional(),
    iconSize: Joi.object({
        width: Joi.string(),
        height: Joi.string(),
    }).optional(),
}).optional();

const workspaceSchema = Joi.object({
    name: WorkspaceNameSchema,
    displayName: Joi.string().required(),
    path: FilePathSchema.required(),
    type: Joi.string()
        .valid(...Object.values(WorkspaceTypes))
        .required(),
    colors: ExtendedJoi.stringToObject(),
    iconFileId: Joi.string(),
    logoFileId: Joi.string(),
    metadata: metadataSchema,
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

// PATCH /api/workspaces/:id/metadata
export const updateMetadataSchema = Joi.object({
    query: {},
    body: metadataSchema,
    params: {
        id: MongoIdSchema.required(),
    },
});
