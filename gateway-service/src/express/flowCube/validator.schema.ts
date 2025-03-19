import Joi from 'joi';

// POST /api/flow-cube/:workspaceId/entities/search/template/:templateId
export const searchFlowCubeRequestSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {
        workspaceId: Joi.string().required(),
        templateId: Joi.string().required(),
    },
});

// POST /api/flow-cube/workspaces/search
export const searchWorkspacesSchema = Joi.object({
    body: Joi.object({
        Parameters: Joi.object({
            Value: Joi.string().allow(''),
        }),
        Value: Joi.string().allow(''),
    }),
    query: {},
    params: {},
});

// POST /api/flow-cube/categories/search
export const searchCategoryInWorkspaceSchema = Joi.object({
    body: Joi.object({
        Value: Joi.string().allow(''),
        WorkspaceId: Joi.string().required(),
    }),
    query: {},
    params: {},
});

// POST /api/flow-cube/templates/search
export const searchEntityTemplateSchema = Joi.object({
    body: Joi.object({
        Value: Joi.string().allow(''),
        WorkspaceId: Joi.string().required(),
        CategoryType: Joi.string().allow(''),
    }),
    query: {},
    params: {},
});

// POST /api/flow-cube/templates/templateId
export const getEntityTemplateByIdSchema = Joi.object({
    body: Joi.object({
        TemplateType: Joi.array().items(Joi.string().allow('')),
        CategoryType: Joi.array().items(Joi.string().allow('')),
        WorkspaceId: Joi.array().items(Joi.string().allow('')),
    }),
    query: {},
    params: {},
});

// POST /api/flow-cube/templates/search/entities
export const searchEntitiesByTemplateSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {},
});
