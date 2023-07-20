import Joi from 'joi';
import { ignoredRuleSchema } from '../rules/ignoredRuleSchema';
import config from '../../config';

const { searchEntitiesBatchMaxLimit } = config;

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

/**
 * POST /api/instances/entities/expanded/:id
 */
export const getExpandedEntityByIdRequestSchema = Joi.object({
    query: {},
    body: {
        disabled: Joi.boolean().default(null),
        templateIds: Joi.array().items(Joi.string()).required(),
        numberOfConnections: Joi.number().default(0),
    },
    params: {
        id: Joi.string().required(),
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
    },
    query: {},
    params: {},
});

const agGridSetFilterSchema = Joi.object({
    filterType: Joi.valid('set').required(),
    values: Joi.array().items(Joi.string().allow(null)),
});

const agGridNumberFilterSchema = Joi.object({
    filterType: Joi.valid('number').required(),
    type: Joi.valid(
        'equals',
        'notEqual',
        'lessThan',
        'lessThanOrEqual',
        'greaterThan',
        'greaterThanOrEqual',
        'inRange',
        'blank',
        'notBlank',
    ).required(),
    filter: Joi.number().when('type', { is: Joi.invalid('blank', 'notBlank'), then: Joi.required() }),
    filterTo: Joi.number().when('type', { is: Joi.valid('inRange'), then: Joi.required() }),
});

const agGridTextFilterSchema = Joi.object({
    filterType: Joi.valid('text').required(),
    type: Joi.valid('equals', 'notEqual', 'contains', 'notContains', 'startsWith', 'endsWith', 'blank', 'notBlank').required(),
    filter: Joi.string().when('type', { is: Joi.invalid('blank', 'notBlank'), then: Joi.required() }),
});

const agGridDateFilterSchema = Joi.object({
    filterType: Joi.valid('date').required(),
    type: Joi.valid(
        'equals',
        'notEqual',
        'lessThan',
        'lessThanOrEqual',
        'greaterThan',
        'greaterThanOrEqual',
        'inRange',
        'blank',
        'notBlank',
    ).required(),
    dateFrom: Joi.string().allow(null).required(),
    dateTo: Joi.string().when('type', { is: Joi.valid('inRange'), then: Joi.required(), otherwise: Joi.allow(null) }),
});

// format of properties keys in entity template
export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

/**
 * POST /api/instances/entities/search
 */
export const getEntitiesRequestSchema = Joi.object({
    body: {
        startRow: Joi.number().required(),
        endRow: Joi.number().required(),
        quickFilter: Joi.string().allow(''),
        filterModel: Joi.object()
            .pattern(
                variableNameValidation, // important when translating to neo4j query (prevent injection)
                Joi.alternatives(agGridTextFilterSchema, agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema),
            )
            .required(),
        sortModel: Joi.array()
            .items(
                Joi.object({
                    colId: variableNameValidation, // important when translating to neo4j query (prevent injection)
                    sort: Joi.string().valid('asc', 'desc'),
                }),
            )
            .required(),
    },
    query: {
        templateIds: Joi.array().items(Joi.string()).required(),
    },
    params: {},
});

const nativeDataTypeSchema = Joi.alternatives(Joi.boolean(), Joi.string(), Joi.number());

const filterOfFieldSchema = Joi.object({
    $eq: nativeDataTypeSchema.allow(null),
    $ne: nativeDataTypeSchema.allow(null),
    $eqi: Joi.string(),
    $gt: nativeDataTypeSchema,
    $gte: nativeDataTypeSchema,
    $lt: nativeDataTypeSchema,
    $lte: nativeDataTypeSchema,
    $in: Joi.alternatives(
        Joi.array().items(Joi.boolean().allow(null)),
        Joi.array().items(Joi.string().allow(null)),
        Joi.array().items(Joi.number().allow(null)),
    ),
});

const filterOfTemplateSchema = Joi.object().pattern(Joi.string(), filterOfFieldSchema).min(1);
const filterSearchBatchSchema = Joi.object({
    $and: Joi.alternatives(filterOfTemplateSchema, Joi.array().items(filterOfTemplateSchema).min(1)),
    $or: Joi.array().items(filterOfTemplateSchema).min(1),
}).min(1);

/*
 * POST /api/instances/entities/search/batch?withConnections
 */
export const searchEntitiesBatchRequestSchema = Joi.object({
    body: {
        skip: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(searchEntitiesBatchMaxLimit).required(),
        textSearch: Joi.string().allow(''),
        templates: Joi.object().pattern(Joi.string(), {
            filter: filterSearchBatchSchema,
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
        ignoredRules: Joi.array().items(ignoredRuleSchema).default([]),
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
        ignoredRules: Joi.array().items(ignoredRuleSchema).default([]),
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
        uniqueConstraints: Joi.array().items(Joi.array().items(Joi.string())).required(),
    }),
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});
