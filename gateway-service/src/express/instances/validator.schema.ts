import Joi from 'joi';
import { fileSchema, MongoIdSchema } from '@microservices/shared';
import { excelTemplateSchema, ExtendedJoi } from '../../utils/joi';
import { brokenRuleSchema } from '../ruleBreaches/validator.schema';
import config from '../../config';

const {
    instanceService: { searchEntitiesMaxLimit },
} = config;

// POST /api/instances/entities
export const createEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
        ignoredRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).default([]),
        childTemplateId: Joi.string(),
    }).unknown(true),
    query: {},
    params: {},
    files: Joi.array().items(fileSchema),
});

// PUT /api/instances/entities/:id
export const updateEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
        ignoredRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).default([]),
        childTemplateId: Joi.string(),
    }).unknown(true),
    query: {},
    params: { id: Joi.string().required() },
    files: Joi.array().items(fileSchema),
});

// PUT /api/instances/entities/bulk
export const updateMultipleEntitiesSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
        ignoredRules: ExtendedJoi.stringToObject().default({}),
        entitiesToUpdate: ExtendedJoi.stringToObject(),
        propertiesToRemove: ExtendedJoi.stringToArray().items(Joi.string()).default([]),
        childTemplateId: Joi.string(),
    }).unknown(true),
    query: {},
    params: {},
    files: Joi.array().items(fileSchema),
});

// PATCH /api/instances/entities/:id/status
export const updateEntityStatusSchema = Joi.object({
    body: Joi.object({
        disabled: Joi.boolean().required(),
        ignoredRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).default([]),
    }).unknown(true),
    query: {},
    params: { id: Joi.string().required() },
});

// POST /api/instances/entities/delete/bulk
const baseDeleteSchema = Joi.object({
    selectAll: Joi.boolean().required(),
    templateId: Joi.string().required(),
    deleteAllRelationships: Joi.boolean(),
});

const selectAllSchema = baseDeleteSchema.keys({
    selectAll: Joi.valid(true).required(),
    idsToExclude: Joi.array().items(Joi.string()),
    filter: Joi.any(), // will be checked by instance-manager
    textSearch: Joi.string().allow(''),
});

const specificIdsSchema = baseDeleteSchema.keys({
    selectAll: Joi.valid(false).required(),
    idsToInclude: Joi.array().items(Joi.string()).min(1).required(),
});

export const deleteEntityInstancesSchema = Joi.object({
    body: Joi.alternatives(selectAllSchema, specificIdsSchema).required(),
    query: {},
    params: {},
});

// POST /api/instances/entities/export/document/:entityId
export const exportEntityToDocumentSchemaByEntityId = Joi.object({
    body: {},
    query: {
        documentTemplateId: Joi.string().required(),
    },
    params: {
        entityId: MongoIdSchema,
    },
});

// POST /api/instances/entities/export
export const exportEntitiesSchema = Joi.object({
    body: {
        fileName: Joi.string().required(),
        textSearch: Joi.any(), // will be checked by instance-manager
        templates: Joi.object().pattern(Joi.string(), {
            filter: Joi.any(), // will be checked by instance-manager
            sort: Joi.any(), // will be checked by instance-manager
            displayColumns: Joi.array().items(Joi.string()),
            headersOnly: Joi.boolean(),
            insertEntities: Joi.array().items(Joi.object().pattern(Joi.string(), Joi.any())),
            isChildTemplate: Joi.boolean(),
        }),
    },
    query: {},
    params: {},
});

// POST /api/instances/entities/export/document
export const exportEntityToDocumentSchema = Joi.object({
    body: {
        documentTemplateId: Joi.string().required(),
        entity: Joi.object(),
    },
    query: {},
    params: {},
});

// POST /api/instances/search/batch
export const searchEntitiesBatchRequestSchema = Joi.object({
    body: {
        skip: Joi.any(),
        limit: Joi.any(),
        textSearch: Joi.any(),
        shouldSemanticSearch: Joi.boolean().default(true),
        // validation only in order to check permissions to templates
        templates: Joi.object().pattern(Joi.string(), {
            filter: Joi.any(),
            showRelationships: Joi.alternatives(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
        }),
        sort: Joi.any(),
    },
    query: {},
    params: {},
});

// POST /api/instances/search/location
export const searchEntitiesByLocationRequestSchema = Joi.object({
    body: Joi.object({
        textSearch: Joi.string().allow(''),
        templates: Joi.object().pattern(
            Joi.string(),
            Joi.object({
                filter: Joi.any(),
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
/*
 * POST /api/instances/entities/count
 */
export const getEntitiesCountByTemplates = Joi.object({
    body: {
        templateIds: Joi.array().items(Joi.string()).required(),
        textSearch: Joi.string().allow(''),
        shouldSemanticSearch: Joi.boolean().default(true),
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

// POST /api/instances/search/templates
export const searchEntitiesByTemplatesSchema = Joi.object({
    body: {
        searchConfigs: Joi.object().pattern(Joi.string(), {
            skip: Joi.number().integer().min(0).default(0),
            limit: Joi.number().integer().min(1).max(searchEntitiesMaxLimit).required(),
            textSearch: Joi.string().allow(''),
            filter: Joi.any(),
            showRelationships: Joi.alternatives(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
            sort: Joi.any(),
            entitiesWithFiles: semanticSearchResult,
        }),
    },
    query: {},
    params: {},
});

// POST /api/instances/relationships
export const createRelationshipSchema = Joi.object({
    body: {
        relationshipInstance: {
            templateId: MongoIdSchema.required(),
            properties: Joi.object(),
            sourceEntityId: Joi.string().required(),
            destinationEntityId: Joi.string().required(),
        },
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
    },
    query: {},
    params: {},
});

// DELETE /api/instances/relationships/:id
export const deleteRelationshipSchema = Joi.object({
    body: {
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

// POST /api/instances/entities/loadEntities
export const loadEntitiesSchema = Joi.object({
    body: {
        file: excelTemplateSchema,
        insertBrokenEntities: ExtendedJoi.stringToArray(
            Joi.array()
                .items(
                    Joi.object({
                        templateId: Joi.string().required(),
                        properties: Joi.object().required(),
                        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
                    }),
                )
                .default([]),
        ),
        templateId: Joi.string().required(),
        isChildTemplate: Joi.string().valid('true', 'false').required(),
    },
    query: {},
    params: {},
});

// POST /api/instances/entities/getChangedEntitiesFromExcel
export const getChangedEntitiesFromExcelSchema = Joi.object({
    body: {
        file: excelTemplateSchema,
        templateId: Joi.string().required(),
        isChildTemplate: Joi.string().valid('true', 'false').required(),
    },
    query: {},
    params: {},
});

// POST /api/instances/entities/editReadExcel
export const editReadExcelSchema = Joi.object({
    body: {
        file: excelTemplateSchema,
        templateId: Joi.string().required(),
        isChildTemplate: Joi.string().valid('true', 'false').required(),
    },
    query: {},
    params: {},
});

// POST /api/instances/entities/editManyEntitiesByExcel
export const editManyEntitiesByExcelSchema = Joi.object({
    body: {
        templateId: Joi.string().required(),
        childTemplateId: Joi.string(),
        entities: ExtendedJoi.stringToArray(
            Joi.array()
                .items(
                    Joi.object({
                        templateId: Joi.string().required(),
                        properties: Joi.object().required(),
                        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
                    }),
                )
                .default([]),
        ),
    },
    query: {},
    params: {},
});
