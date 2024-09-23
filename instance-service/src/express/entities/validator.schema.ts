import Joi from 'joi';
import { brokenRuleSchema } from '../rules/ignoredRuleSchema';
import config from '../../config';

const { searchEntitiesMaxLimit } = config;

/**
 * GET /api/instances/entities/:id
 */
export const getEntityByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

const commonFormInputSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
});

/**
 * POST /api/instances/entities/ids
 */
export const getEntitiesByIdsRequestSchema = Joi.object({
    query: {},
    body: {
        ids: Joi.array().items(Joi.string()).required(),
    },
    params: {},
});

/**
 * PUT /api/instances/entities/update-enum-field/:id
 */
export const updateEnumFieldRequestSchema = Joi.object({
    query: {},
    body: {
        newValue: Joi.string().required(),
        oldValue: Joi.string().required(),
        field: commonFormInputSchema,
    },
    params: {
        id: Joi.string().required(),
    },
});

/**
 * GET /api/instances/entities/get-is-field-used/:id
 */
export const getIfValuefieldIsUsedRequestSchema = Joi.object({
    body: {},
    params: {
        id: Joi.string().required(),
    },
    query: {
        type: Joi.string().required(),
        fieldValue: Joi.string().required(),
        fieldName: Joi.string().required(),
    },
});

/**
 * DELETE /api/instances/entities/:id?deleteAllRelationships=true
 */
export const deleteEntityByIdRequestSchema = Joi.object({
    query: {
        deleteAllRelationships: Joi.boolean().default(false),
    },
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

/**
 * DELETE /api/instances/entities?templateId
 */
export const deleteEntitiesByTemplateIdRequestSchema = Joi.object({
    query: {
        templateId: Joi.string().required(),
    },
    body: {},
    params: {},
});

/**
 * POST /api/instances/entities
 */
export const createEntityRequestSchema = Joi.object({
    body: {
        templateId: Joi.string().required(),
        properties: Joi.object().required(),
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
        duplicatedFromId: Joi.string().optional(),
    },
    query: {},
    params: {},
});

// format of properties keys in entity template
export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

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

/**
 * POST /api/instances/entities/expanded/:id
 */
export const getExpandedGraphByIdRequestSchema = Joi.object({
    query: {},
    body: {
        disabled: Joi.boolean().default(null),
        templateIds: Joi.array().items(Joi.string()).required(),
        numberOfConnections: Joi.number().default(0),
        expandedParams: Joi.object().pattern(Joi.string(), Joi.number().min(1)).default({}),
        filters: Joi.object()
            .pattern(Joi.string(), {
                filter: searchFilterSchema,
            })
            .default({}),
        userId: Joi.string().required(),
    },
    params: {
        id: Joi.string().required(),
    },
});

/*
 * POST /api/instances/entities/search/template/:templateId
 */
export const searchEntitiesOfTemplateRequestSchema = Joi.object({
    body: {
        skip: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(searchEntitiesMaxLimit).required(),
        textSearch: Joi.string().allow(''),
        filter: searchFilterSchema,
        showRelationships: Joi.alternatives(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
        sort: Joi.array()
            .items(
                Joi.object({
                    field: variableNameValidation, // important when translating to neo4j query (prevent injection)
                    sort: Joi.string().valid('asc', 'desc'),
                }),
            )
            .unique('field')
            .default([]),
    },
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

/*
 * POST /api/instances/entities/search/batch
 */
export const searchEntitiesBatchRequestSchema = Joi.object({
    body: {
        skip: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(searchEntitiesMaxLimit).required(),
        textSearch: Joi.string().allow(''),
        templates: Joi.object().pattern(Joi.string(), {
            filter: searchFilterSchema,
            showRelationships: Joi.alternatives(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
        }),
        sort: Joi.array()
            .items(
                Joi.object({
                    field: variableNameValidation, // important when translating to neo4j query (prevent injection)
                    sort: Joi.string().valid('asc', 'desc'),
                }),
            )
            .unique('field')
            .default([]),
    },
    query: {},
    params: {},
});

/**
 * PATCH /api/instances/entities/:id/status
 */
export const updateEntityStatusByIdRequestSchema = Joi.object({
    body: {
        disabled: Joi.boolean().required(),
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

/**
 * PUT /api/instances/entities/:id
 */
export const updateEntityByIdRequestSchema = Joi.object({
    body: {
        properties: Joi.object().required(),
        templateId: Joi.string().required(),
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

export const getConstraintsOfTemplateRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

export const getAllConstraintsRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {},
});

export const updateConstraintsOfTemplateRequestSchema = Joi.object({
    body: Joi.object({
        requiredConstraints: Joi.array().items(Joi.string()).required(),
        uniqueConstraints: Joi.array()
            .items(Joi.object({ groupName: Joi.string().allow(''), properties: Joi.array().items(Joi.string()) }))
            .required(),
    }),
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

/*
 * PATCH /api/instances/entities/deletePropertiesOfTemplate/:templateId
 */
export const deletePropertiesOfTemplateRequestSchema = Joi.object({
    body: {
        properties: Joi.array().items(Joi.string()).required(),
    },
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

export const enumerateNewSerialNumberFieldsRequestSchema = Joi.object({
    body: Joi.object({
        newSerialNumberFields: Joi.object().required(),
    }),
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});
