import Joi from 'joi';
import { ColorSchema, MongoIdSchema, fileSchema, iconFileSchema } from '@microservices/shared';
import { ExtendedJoi } from '../../utils/joi';

const nativeDataTypeSchema = Joi.alternatives(Joi.boolean(), Joi.string(), Joi.number());

const filterOfFieldSchema = Joi.object({
    $eq: nativeDataTypeSchema.allow(null),
    $ne: nativeDataTypeSchema.allow(null),
    $eqi: Joi.string(),
    $rgx: Joi.string(), // regex syntax of Neo4j (Java Regular Expression). validated by neo itself
    $gt: nativeDataTypeSchema,
    $gte: nativeDataTypeSchema,
    $lt: nativeDataTypeSchema,
    $lte: nativeDataTypeSchema,
    $in: Joi.alternatives(
        Joi.array().items(Joi.boolean().allow(null)),
        Joi.array().items(Joi.string().allow(null)),
        Joi.array().items(Joi.number().allow(null)),
    ),
    $not: Joi.link('#filterOfField'),
})
    .min(1)
    .id('filterOfField');

const filterOfTemplateSchema = Joi.object().pattern(Joi.string(), filterOfFieldSchema).min(1);
const searchFilterSchema = Joi.object({
    $and: Joi.alternatives(filterOfTemplateSchema, Joi.array().items(filterOfTemplateSchema).min(1)),
    $or: Joi.array().items(filterOfTemplateSchema).min(1),
}).min(1);

const childTemplatePropertySchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().required(),
    format: Joi.string(),
    defaultValue: Joi.any(),
    filters: searchFilterSchema,
});

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
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
    file: iconFileSchema,
    files: Joi.array().items(fileSchema),
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

// POST /api/templates/entities/child/search
export const searchEntityChildTemplatesSchema = Joi.object({
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        fatherTemplatesIds: Joi.array().items(MongoIdSchema),
    },
    query: {},
    params: {},
});

// GET /api/templates/entities/child
export const getAllChildTemplatesSchema = Joi.object({
    body: {},
    query: {},
    params: {},
});

// POST /api/templates/entities/child
export const createEntityChildTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        description: Joi.string(),
        fatherTemplateId: MongoIdSchema.required(),
        categories: Joi.array().items(MongoIdSchema).required(),
        properties: Joi.object().pattern(Joi.string(), childTemplatePropertySchema).required(),
        disabled: Joi.boolean().default(false),
        actions: Joi.string(),
        viewType: Joi.string().valid('categoryPage', 'userPage').required(),
        isFilterByCurrentUser: Joi.boolean().default(false),
        isFilterByUserUnit: Joi.boolean().default(false),
    },
    query: {},
    params: {},
});
