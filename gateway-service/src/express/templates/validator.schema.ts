import Joi from 'joi';
import { ColorSchema, MongoIdSchema, fileSchema, iconFileSchema, ConfigTypes, filterOfTemplateSchema } from '@microservices/shared';
import { ExtendedJoi } from '../../utils/joi';

const searchFilterSchema = Joi.object({
    $and: Joi.array().items(filterOfTemplateSchema),
    $or: Joi.array().items(filterOfTemplateSchema),
});

const childTemplatePropertySchema = Joi.object({
    defaultValue: Joi.any(),
    filters: searchFilterSchema,
    isEditableByUser: Joi.boolean(),
});

const EntityChildTemplateSchema = {
    name: Joi.string().required(),
    displayName: Joi.string().required(),
    description: Joi.string(),
    parentTemplateId: MongoIdSchema.required(),
    category: MongoIdSchema.required(),
    properties: Joi.object({
        properties: Joi.object().pattern(Joi.string(), childTemplatePropertySchema).required(),
    }).required(),
    disabled: Joi.boolean().default(false),
    actions: Joi.string(),
    viewType: Joi.string().valid('categoryPage', 'userPage').required(),
    isFilterByCurrentUser: Joi.boolean().default(false),
    isFilterByUserUnit: Joi.boolean().default(false),
    filterByCurrentUserField: Joi.string(),
};

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
        templatesOrder: ExtendedJoi.stringToArray(),
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

// PATCH /api/templates/categories/templatesOrder/:templateId
export const updateCategoryTempOrderSchema = Joi.object({
    query: {},
    body: {
        newCategoryId: MongoIdSchema.required(),
        srcCategoryId: MongoIdSchema.required(),
        newIndex: Joi.number().required().min(0),
    },
    params: {
        templateId: MongoIdSchema.required(),
    },
});

export const getCategoriesSchema = Joi.object({
    query: { search: Joi.string() },
    body: {},
    params: {},
});

// POST /api/templates/entities
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
        mapSearchProperties: ExtendedJoi.stringToArray(),
        fieldGroups: ExtendedJoi.stringToArray(),
    },
    query: {},
    params: {},
    file: iconFileSchema,
    files: Joi.array().items(fileSchema),
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
        documentTemplatesIds: ExtendedJoi.stringToArray(),
        mapSearchProperties: ExtendedJoi.stringToArray(),
        fieldGroups: ExtendedJoi.stringToArray(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
    file: iconFileSchema,
    files: Joi.array().items(fileSchema),
});

// PATCH /api/entities/templates/:templateId/actions
export const updateEntityTemplateActionSchema = Joi.object({
    body: {
        actions: Joi.string().required(),
        isChildTemplate: Joi.boolean(),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
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

// POST /api/entities/templates/search/:userId
export const searchEntityTemplatesOfUserFromParamsSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {
        userId: Joi.string(),
    },
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
        isProperty: Joi.boolean(),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PUT /api/templates/relationships/convertToRelationshipField/:id
export const convertToRelationshipFieldRequestSchema = Joi.object({
    body: {
        fieldName: Joi.string().required(),
        displayFieldName: Joi.string().required(),
        relationshipReference: Joi.object().required(),
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

// POST /api/relationship/templates/search?search=value
export const searchTemplatesRequestSchema = Joi.object({
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        sourceEntityIds: Joi.array().items(MongoIdSchema),
        destinationEntityIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
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

// POST /api/templates/rules/search
export const searchRulesRequestSchema = Joi.object({
    body: {
        search: Joi.string(),
        entityTemplateIds: Joi.array().items(MongoIdSchema),
        disabled: Joi.boolean(),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
});

// POST /api/templates/child/search
export const searchEntityChildTemplatesSchema = Joi.object({
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
});

// GET /api/templates/child
export const getAllChildTemplatesSchema = Joi.object({
    body: {},
    query: {},
    params: {},
});

// POST /api/templates/child
export const createEntityChildTemplateSchema = Joi.object({
    body: {
        ...EntityChildTemplateSchema,
    },
    query: {},
    params: {},
});

export const updateEntityChildTemplateSchema = Joi.object({
    body: {
        ...EntityChildTemplateSchema,
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

export const deleteEntityChildTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});
// GET /api/templates/config/all
export const getAllConfigsSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

// GET /api/templates/config/:type
export const getConfigByTypeSchema = Joi.object({
    query: {},
    body: {},
    params: {
        type: Joi.string()
            .valid(...Object.values(ConfigTypes))
            .required(),
    },
});

// PUT /api/templates/config/:configId
export const updateOrderConfigSchema = Joi.object({
    query: {},
    body: {
        newIndex: Joi.number().min(0).required(),
        item: MongoIdSchema.required(),
    },
    params: {
        configId: MongoIdSchema.required(),
    },
});

// POST /api/templates/config
export const createOrderConfigSchema = Joi.object({
    query: {},
    body: {
        type: Joi.string()
            .valid(...Object.values(ConfigTypes))
            .required(),
        order: Joi.array().items(MongoIdSchema),
    },
    params: {},
});
