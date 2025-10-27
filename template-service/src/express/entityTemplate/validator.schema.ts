import { MongoIdSchema, variableNameValidation } from '@microservices/shared';
import Joi from 'joi';
import {
    enumPropertiesColorsSchema,
    innerFieldGroupsSchema,
    innerPropertiesSchema,
    orderPropertiesSchema,
    orderPropertiesTypeSchema,
    previewPropertiesSchema,
    stringFormats,
} from './joi.helper';

const entityTemplateSchema = {
    name: variableNameValidation.required(),
    displayName: Joi.string().required(),
    category: Joi.string().required(),
    properties: innerPropertiesSchema.required(),
    iconFileId: Joi.string().allow(null),
    propertiesOrder: orderPropertiesSchema.required(),
    propertiesTypeOrder: orderPropertiesTypeSchema.required(),
    propertiesPreview: previewPropertiesSchema.required(),
    enumPropertiesColors: enumPropertiesColorsSchema,
    documentTemplatesIds: Joi.array().items(Joi.string()),
    mapSearchProperties: Joi.array().items(Joi.string()),
    fieldGroups: innerFieldGroupsSchema,
};

// POST /api/entities/templates/searchByFormat
export const searchEntityTemplatesByFormatSchema = Joi.object({
    query: {},
    body: {
        format: Joi.string()
            .valid(...stringFormats)
            .required(),
    },
    params: {},
});

// POST /api/entities/templates/search
export const searchEntityTemplatesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});

// GET /api/entities/templates/:templateId
export const getEntityTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: { templateId: MongoIdSchema.required() },
});

// GET /api/entities/templates/related/:relatedTemplateId
export const getTemplatesUsingRelationshipReferenceSchema = Joi.object({
    query: {},
    body: {},
    params: { relatedTemplateId: MongoIdSchema.required() },
});

// DELETE /api/entities/templates/:templateId
export const deleteEntityTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { templateId: MongoIdSchema.required() },
});

// POST api/entities/templates
export const createEntityTemplateSchema = Joi.object({
    body: {
        ...entityTemplateSchema,
        disabled: Joi.boolean().default(false),
        actions: Joi.forbidden(),
    },
    query: {},
    params: {},
});

// PUT /api/entities/templates/:templateId
export const updateEntityTemplateSchema = Joi.object({
    body: {
        ...entityTemplateSchema,
        actions: Joi.string(),
        allowToDeleteRelationshipFields: Joi.boolean(),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// PUT /api/entities/templates/:templateId/status
export const updateEntityTemplateStatusSchema = Joi.object({
    body: {
        disabled: Joi.boolean().required(),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// PUT /api/entities/templates/convertToRelationshipField/:templateId/:relationshipTemplateId
export const convertToRelationshipFieldRequestSchema = Joi.object({
    body: Joi.object({
        ...entityTemplateSchema,
        actions: Joi.string(),
    }).min(1),
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
        relationshipTemplateId: MongoIdSchema.required(),
    },
});

// PATCH /api/entities/templates/:templateId/actions
export const updateEntityTemplateActionSchema = Joi.object({
    body: {
        actions: Joi.string().required(),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// GET /api/entities/templates/
export const getAllTemplatesSchema = Joi.object({
    body: {},
    query: {},
    params: {},
});
