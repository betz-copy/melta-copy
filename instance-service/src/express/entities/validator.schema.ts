import { MongoIdSchema, searchFilterSchema, variableNameValidation } from '@microservices/shared';
import Joi from 'joi';
import config from '../../config';
import { brokenRuleSchema } from '../rules/ignoredRuleSchema';

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
 * PUT /api/instances/entities/convert-fields-to-plural/:id
 */
export const convertFieldsToPluralRequestSchema = Joi.object({
    body: Joi.object({
        propertiesKeysToPluralize: Joi.array().items(Joi.string()).required(),
    }),
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

/**
 * GET /api/instances/entities/get-is-field-used/:id
 */
export const getIfValueFieldIsUsedRequestSchema = Joi.object({
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
 * POST /api/instances/entities/rules/dependant
 */
export const getDependentRulesRequestSchema = Joi.object({
    body: {
        rules: Joi.array().required(),
        relationshipTemplateId: Joi.string().required(),
    },
    params: {},
    query: {},
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
        childTemplate: Joi.object({ id: Joi.string().required(), filter: searchFilterSchema.optional() }).optional(),
    },
    query: {},
    params: {},
});

/**
 * POST /api/instances/entities/printTemplates/:id
 * getPrintTemplatesByIdRequestSchema
 */
export const getPrintEntitiesByIdRequestSchema = Joi.object({
    query: {},
    body: {
        relationshipIds: Joi.array().items(Joi.string()).min(1).required(),
    },
    params: {
        id: Joi.string().required(),
    },
});

/**
 * POST /api/instances/entities/printEntities/:id
 */
export const getPrintTemplatesByIdRequestSchema = Joi.object({
    query: {},
    body: {
        isShowDisabled: Joi.boolean().default(true),
        relationshipIds: Joi.array().items(Joi.string()),
        templateIds: Joi.array().items(Joi.string()).required(),
        expandedParams: Joi.object()
            .pattern(
                Joi.string(),
                Joi.object({
                    minLevel: Joi.number().integer().min(1).max(Joi.ref('maxLevel')).optional(),
                    maxLevel: Joi.number().integer().min(1).required(),
                }),
            )
            .default({}),
        filters: Joi.object()
            .pattern(Joi.string(), {
                filter: searchFilterSchema,
            })
            .default({}),
        userId: Joi.string().required(),
        childTemplateId: Joi.string(),
    },
    params: {
        id: Joi.string().required(),
    },
});

/**
 * POST /api/instances/entities/expanded/:id
 */
export const getExpandedGraphByIdRequestSchema = Joi.object({
    query: {},
    body: {
        isShowDisabled: Joi.boolean().default(true),
        templateIds: Joi.array().items(Joi.string()).required(),
        numberOfConnections: Joi.number().default(0),
        expandedParams: Joi.object()
            .pattern(
                Joi.string(),
                Joi.object({
                    minLevel: Joi.number().integer().min(1).max(Joi.ref('maxLevel')).optional(),
                    maxLevel: Joi.number().integer().min(1).required(),
                }),
            )
            .default({}),
        filters: Joi.object()
            .pattern(Joi.string(), {
                filter: searchFilterSchema,
            })
            .default({}),
        userId: Joi.string().required(),
        childTemplateId: Joi.string(),
    },
    params: {
        id: Joi.string().required(),
    },
});

const searchByTemplateSchema = {
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
    userEntityId: Joi.string().optional(),
};

export const chartSchema = Joi.object({
    body: Joi.object({
        childTemplateId: Joi.string(),
        chartsData: Joi.array()
            .items(
                Joi.object({
                    _id: Joi.string(),
                    xAxis: Joi.any(),
                    yAxis: Joi.any(),
                    filter: searchFilterSchema,
                }),
            )
            .required(),
        units: Joi.array()
            .items(
                Joi.object({
                    _id: MongoIdSchema,
                    name: Joi.string(),
                    workspaceId: MongoIdSchema,
                    parentId: MongoIdSchema.allow('', null).empty(''),
                    disabled: Joi.bool(),
                    createdAt: Joi.date(),
                    updatedAt: Joi.date(),
                    path: Joi.string().allow(''),
                }),
            )
            .required(),
    }),
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

/*
 * POST /api/instances/entities/search/template/:templateId
 */
export const searchEntitiesOfTemplateRequestSchema = Joi.object({
    body: {
        ...searchByTemplateSchema,
        entityIdsToInclude: Joi.array().items(Joi.string()),
    },
    query: {},
    params: {
        templateId: Joi.string().required(),
    },
});

/*
 * POST /api/instances/search/templates
 */
export const searchEntitiesByTemplatesSchema = Joi.object({
    body: {
        searchConfigs: Joi.object().pattern(Joi.string(), {
            ...searchByTemplateSchema,
        }),
    },
    query: {},
    params: {},
});

const semanticSearchResult = Joi.object().pattern(
    Joi.string(),
    Joi.object().pattern(
        Joi.string(),
        Joi.array().items(
            Joi.object({
                minioFileId: Joi.string(),
                text: Joi.string(),
            }),
        ),
    ),
);

// * search body for multiple select
const selectAllSchema = Joi.object({
    idsToExclude: Joi.array().items(Joi.string()),
    filter: searchFilterSchema,
    textSearch: Joi.string().allow(''),
});

const specificIdsSchema = Joi.object({
    idsToInclude: Joi.array().items(Joi.string()).min(1).required(),
});

const multipleSelectSchema = Joi.object({
    selectAll: Joi.boolean().required(),
}).when(Joi.object({ selectAll: Joi.valid(true) }).unknown(), {
    then: selectAllSchema,
    otherwise: specificIdsSchema,
});

// /**
//  * POST /api/instances/entities/delete/bulk
//  */
const baseDeleteSchema = Joi.object({
    templateId: Joi.string().required(),
    deleteAllRelationships: Joi.boolean(),
    selectAll: Joi.boolean().required(),
    childTemplateId: Joi.string().optional(),
});

export const deleteEntitiesByIdsRequestSchema = Joi.object({
    body: baseDeleteSchema.concat(multipleSelectSchema),
    query: {},
    params: {},
});

// /**
//  * POST /api/instances/entities/get/multiple-select
//  */

const baseUpdateSchema = Joi.object({
    templateId: Joi.string().required(),
    selectAll: Joi.boolean().required(),
    showRelationships: Joi.boolean().default(false),
});

export const getSelectedEntitiesRequestSchema = Joi.object({
    body: baseUpdateSchema.concat(multipleSelectSchema),
    query: {},
    params: {},
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

/*
 * POST /api/instances/entities/count
 */
export const countEntitiesOfTemplatesRequestSchema = Joi.object({
    body: {
        templateIds: Joi.array().items(Joi.string()).required(),
        textSearch: Joi.string().allow(''),
        semanticSearchResult,
    },
    query: {},
    params: {},
});

/*
 * POST /api/instances/entities/count/user-entity-id
 */
export const countEntitiesOfTemplatesByUserEntityIdRequestSchema = Joi.object({
    body: {
        templateIds: Joi.array().items(Joi.string()).required(),
        userEntityId: Joi.string().required(),
    },
    query: {},
    params: {},
});

/*
 * POST /api/instances/entities/search/batch
 */
export const searchEntitiesBatchRequestSchema = Joi.object({
    body: {
        skip: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(searchEntitiesMaxLimit).required(),
        textSearch: Joi.string().allow(''),
        entityIdsToInclude: Joi.array().items(Joi.string()),
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

// POST /api/instances/search/map
export const searchEntitiesByLocation = Joi.object({
    body: Joi.object({
        textSearch: Joi.string().allow(''),
        templates: Joi.object().pattern(
            Joi.string(),
            Joi.object({
                filter: Joi.any(),
                locationFields: Joi.array().items(Joi.string()).min(1),
            }),
        ),
        circle: Joi.object({
            coordinate: Joi.array().items(Joi.number()).length(2).required(),
            radius: Joi.number().positive().required(),
        }),
        polygon: Joi.array().items(Joi.array().items(Joi.number()).length(2)),
    }).xor('circle', 'polygon'),
    query: Joi.object(),
    params: Joi.object(),
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
        userId: Joi.string(),
        convertToRelationshipField: Joi.boolean().default(false),
        updateOnlyGivenProps: Joi.boolean().default(false),
        childTemplate: Joi.object({ id: Joi.string().required(), filter: searchFilterSchema.optional() }).optional(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

const relationshipsSchema = Joi.object({
    templateId: Joi.string(),
    properties: Joi.object(),
    sourceEntityId: Joi.string(),
    destinationEntityId: Joi.string(),
});

/**
 * PATCH /api/instances/entities/convertToRelationshipField
 */
export const convertToRelationshipFieldRequestSchema = Joi.object({
    body: {
        existingRelationships: Joi.array().items(relationshipsSchema).required(),
        addFieldToSrcEntity: Joi.boolean().required(),
        fieldName: Joi.string().required(),
        userId: Joi.string().required(),
    },
    query: {},
    params: {},
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
        currentTemplateProperties: Joi.object().required(),
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

export const runRulesWithTodayFuncRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {},
});
