import Joi from 'joi';
import { ColorSchema, ExtendedJoi, iconFileSchema, MongoIdSchema, pdfTemplateSchema } from '../../utils/joi';

// POST /api/templates/categories
export const createCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        color: ColorSchema.required(),
    },
    params: {},
    file: iconFileSchema,
});

// PUT /api/templates/categories
export const updateCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        iconFileId: Joi.string().allow(null),
        color: ColorSchema,
    },
    params: {
        id: MongoIdSchema.required(),
    },
    file: iconFileSchema,
});

// DELETE /api/templates/categories/:id
export const deleteCategorySchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// GET /api/templates/entities
export const exportEntityTemplateToPdfSchema = Joi.object({
    body: {},
    query: {
        entityTemplateId: Joi.string(),
    },
    params: {
        entityId: Joi.string().required(),
    },
});

// POST /api/templates/entities/pdf/:entityId
export const createEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        category: Joi.string().required(),
        disabled: Joi.boolean().valid(false),
        properties: ExtendedJoi.stringToObject().required(),
        propertiesOrder: ExtendedJoi.stringToArray().required(),
        propertiesTypeOrder: ExtendedJoi.stringToArray().required(),
        propertiesPreview: ExtendedJoi.stringToArray().required(),
        enumPropertiesColors: ExtendedJoi.stringToObject(),
        uniqueConstraints: ExtendedJoi.stringToArray().required(),
    },
    query: {},
    params: {},
    files: { file: Joi.array().items(iconFileSchema).length(1), files: Joi.array().items(pdfTemplateSchema) },
});

// PUT /api/templates/entities/update-enum-field/:id
export const updateFieldValueSchema = Joi.object({
    body: {
        fieldValue: Joi.string().required(),
        partialInput: Joi.object({
            name: Joi.string().required(),
            type: Joi.string().required(),
            options: Joi.array().items(Joi.string()).required(),
        }),
        field: Joi.string().required(),
    },
});

// DELETE /api/templates/entities/delete-enum-field/:id
export const deleteFieldValueSchema = Joi.object({
    body: {
        fieldValue: Joi.string().required(),
        partialInput: Joi.object({
            name: Joi.string().required(),
            type: Joi.string().required(),
            options: Joi.array().items(Joi.string()).required(),
        }),
    },
});

// PUT /api/templates/entities/:id
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        category: Joi.string().required(),
        properties: ExtendedJoi.stringToObject().required(),
        iconFileId: Joi.string().allow(null), // todo: iconFileId is optional and nullable, should be only one of them
        propertiesOrder: ExtendedJoi.stringToArray().required(),
        propertiesTypeOrder: ExtendedJoi.stringToArray().required(),
        propertiesPreview: ExtendedJoi.stringToArray().required(),
        enumPropertiesColors: ExtendedJoi.stringToObject(),
        uniqueConstraints: ExtendedJoi.stringToArray().required(),
        pdfTemplatesIds: ExtendedJoi.stringToArray(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
    files: { file: Joi.array().items(iconFileSchema).length(1), files: Joi.array().items(pdfTemplateSchema) },
});

// PATCH /api/templates/entities/:id/status
export const updateEntityTemplateStatusSchema = Joi.object({
    body: {
        disabled: Joi.boolean(),
    },
    query: {},
    params: { id: MongoIdSchema.required() },
});

// DELETE /api/templates/entities/:id
export const deleteEntityTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { id: MongoIdSchema.required() },
});

// POST /api/templates/relationships
export const createRelationshipTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        sourceEntityId: MongoIdSchema.required(),
        destinationEntityId: MongoIdSchema.required(),
    },
    query: {},
    params: {},
});

// PUT /api/templates/relationships/:id
export const updateRelationshipTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        sourceEntityId: MongoIdSchema.required(),
        destinationEntityId: MongoIdSchema.required(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// DELETE /api/templates/relationships/:id
export const deleteRelationshipTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { id: MongoIdSchema.required() },
});

// PATCH /api/templates/rules/:ruleId/status
export const updateRuleStatusByIdRequestSchema = Joi.object({
    body: {
        disabled: Joi.boolean().required(),
    },
    query: {},
    params: {
        ruleId: Joi.string().required(),
    },
});

export const deleteRuleByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        ruleId: Joi.string().required(),
    },
});
