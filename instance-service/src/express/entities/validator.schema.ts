import Joi from 'joi';

// GET /api/entities/:id
export const getEntityByIdRequestSchema = Joi.object({
    query: {
        expanded: Joi.boolean().default(false),
    },
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// DELETE /api/entities/:id?deleteAllRelationships=true
export const deleteEntityByIdRequestSchema = Joi.object({
    query: {
        deleteAllRelationships: Joi.boolean().default(false),
    },
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// DELETE /api/entities/:templateId
export const deleteEntityByTemplateIdRequestSchema = Joi.object({
    query: {
        templateId: Joi.string().required(),
    },
    body: {},
    params: {},
});

// POST /api/entities
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
    filter: Joi.number().required(),
    filterTo: Joi.number(),
});

const agGridTextFilterSchema = Joi.object({
    filterType: Joi.valid('text').required(),
    type: Joi.valid('equals', 'notEqual', 'contains', 'notContains', 'startsWith', 'endsWith', 'blank', 'notBlank').required(),
    filter: Joi.string().required(),
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
    dateFrom: Joi.string().required(),
    dateTo: Joi.when('type', {
        is: 'inRange',
        then: Joi.string().required(),
    }),
});

// POST /api/entites/search
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

// PUT /api/entities/:id
export const updateEntityByIdRequestSchema = Joi.object({
    body: {
        properties: Joi.object().required(),
        templateId: Joi.string().required(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});
