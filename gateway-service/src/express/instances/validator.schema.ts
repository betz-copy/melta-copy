import Joi from 'joi';
import { excelTemplateSchema, ExtendedJoi, fileSchema, MongoIdSchema } from '../../utils/joi';
import { brokenRuleSchema } from '../ruleBreaches/validator.schema';
import config from '../../config';

const {
    instanceService: { searchEntitiesMaxLimit },
} = config;

export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

// POST /api/instances/entities
export const createEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
        ignoredRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).default([]),
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
        key: Joi.string().default('id'),
    }).unknown(true),
    query: {},
    params: { value: Joi.string().required() },
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

// DELETE /api/instances/entities/:id
export const deleteEntityInstanceSchema = Joi.object({
    body: {},
    query: {},
    params: { id: Joi.string().required() },
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
        }),
    },
    query: {},
    params: {},
});

// POST /api/instances/entities/export/document
export const exportEntityToDocumentSchema = Joi.object({
    body: {
        documentTemplateId: Joi.string().required(),
        entityProperties: Joi.object(),
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
        insertBrokenEntities: {
            entitiesToCreate: Joi.array().items({ templateId: Joi.string(), properties: Joi.object() }).default([]),
            ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        },
        templateId: Joi.string().required(),
    },
    query: {},
});
