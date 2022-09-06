import Joi from 'joi';

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

/**
 * POST /api/instances/entities/search
 */
export const getEntitiesRequestSchema = Joi.object({
    body: {
        startRow: Joi.number().required(),
        endRow: Joi.number().required(),
        quickFilter: Joi.string(),
        filterModel: Joi.object()
            .pattern(/^/, Joi.alternatives(agGridTextFilterSchema, agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema))
            .required(),
        sortModel: Joi.array()
            .items(
                Joi.object({
                    colId: Joi.string(),
                    sort: Joi.string().valid('asc', 'desc'),
                }),
            )
            .required(),
    },
    query: {
        templateId: Joi.string().required(),
    },
    params: {},
});

/**
 * PATCH /api/instances/entities/:id/status
 */
export const updateEntityStatusByIdRequestSchema = Joi.object({
    body: {
        disabled: Joi.boolean().required(),
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
        ignoredRules: Joi.array()
            .items(
                Joi.object({
                    ruleId: Joi.string().required(),
                    relationshipsIds: Joi.array().items(Joi.string()).required(),
                }),
            )
            .default([]),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});
