import { Colors, FilePathSchema, HexColorSchema, MongoIdSchema, WorkspaceNameSchema, WorkspaceTypes } from '@microservices/shared';
import * as Joi from 'joi';

// Joi schema for IMetadata
const metadataSchema = Joi.object({
    shouldNavigateToEntityPage: Joi.boolean(),
    isDrawerOpen: Joi.boolean(),
    flowCube: Joi.boolean(),
    isDashboardHomePage: Joi.boolean(),
    agGrid: Joi.object({
        rowCount: Joi.number(),
        defaultExpandedRowCount: Joi.number(),
        defaultRowHeight: Joi.number(),
        defaultFontSize: Joi.number(),
        defaultExpandedTableHeight: Joi.number(),
    }).optional(),
    mainFontSizes: Joi.object({
        headlineTitleFontSize: Joi.string(),
        entityTemplateTitleFontSize: Joi.string(),
        headlineSubTitleFontSize: Joi.string(),
    }).optional(),
    iconSize: Joi.object({
        width: Joi.string(),
        height: Joi.string(),
    }).optional(),
    excel: Joi.object({
        entitiesFileLimit: Joi.number(),
        filesLimit: Joi.number(),
    }).optional(),
    searchLimits: Joi.object({
        bulk: Joi.number(),
    }).optional(),
    unitFieldSplitDepth: Joi.number(),
    clientSide: Joi.object({
        usersInfoChildTemplateId: Joi.string(),
        numOfPropsToShow: Joi.number(),
        clientSideWorkspaceName: Joi.string().valid('simba', 'azarim'),
        fullNameField: Joi.string(),
    }).optional(),
    mapPage: Joi.object({
        showMapPage: Joi.boolean(),
        sourceTemplateId: Joi.string().allow(''),
        destTemplateId: Joi.string().allow(''),
        sourceFieldForColor: Joi.string().allow(''),
    }).optional(),
    numOfRelationshipFieldsToShow: Joi.number(),
    twinTemplates: Joi.array().items(Joi.string().trim()).optional(),
}).optional();

// Joi schema for Workspace
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

// PATCH /api/workspaces/:id/metadata
export const updateMetadataSchema = Joi.object({
    query: {},
    body: metadataSchema,
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/workspaces/search
export const searchWorkspacesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
    },
    params: {},
});
