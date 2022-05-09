import * as Joi from 'joi';

// GET /api/instances/entities/:id
export const getEntityByIdRequestSchema = Joi.object({
    query: {
        expanded: Joi.boolean().default(false),
    },
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// DELETE /api/instances/entities/:id?deleteAllRelationships=true
export const deleteEntityByIdRequestSchema = Joi.object({
    query: {
        deleteAllRelationships: Joi.boolean().default(false),
    },
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// POST /api/instances/entities
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
    values: Joi.array().items(Joi.string()),
});

const agGridNumberFilterSchema = Joi.object({
    filterType: Joi.valid('number').required(),
    type: Joi.valid('equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange').required(),
    filter: Joi.number().required(),
    filterTo: Joi.number(),
});

const agGridTextFilterSchema = Joi.object({
    filterType: Joi.valid('text').required(),
    type: Joi.valid('equals', 'notEqual', 'contains', 'notContains', 'startsWith', 'endsWith').required(),
    filter: Joi.string().required(),
});

const agGridDateFilterSchema = Joi.object({
    filterType: Joi.valid('date').required(),
    type: Joi.valid('equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange').required(),
    dateFrom: Joi.string().required(),
    dateTo: Joi.when('type', {
        is: 'inRange',
        then: Joi.string().required(),
    }),
});

// POST /api/instances/entities/search
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

// PUT /api/instances/entities/:id
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

// POST /api/instances/relationships
export const createRelationshipRequestSchema = Joi.object({
    body: {
        templateId: Joi.string().required(),
        properties: Joi.object(),
        sourceEntityId: Joi.string().required(),
        destinationEntityId: Joi.string().required(),
    },
    query: {},
    params: {},
});

// DELETE /api/instances/relationships/:id
export const deleteRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// PUT /api/instances/relationships/:id
export const updateRelationshipByIdRequestSchema = Joi.object({
    body: {
        properties: Joi.object(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});
