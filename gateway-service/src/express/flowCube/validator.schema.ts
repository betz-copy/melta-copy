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

export const searchCategoryInWorkspaceSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {
        workspaceId: Joi.string().required(),
    },
});

export const searchTemplatesSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {
        workspaceId: Joi.string().required(),
    },
});

export const getEntityTemplateByIdSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {
        workspaceId: Joi.string().required(),
    },
});

export const searchEntitiesByTemplateSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: {
        workspaceId: Joi.string().required(),
    },
});
