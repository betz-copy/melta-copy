import * as Joi from 'joi';
import { ExtendedJoi, fileSchema, MongoIdSchema } from '../../utils/joi';
import { brokenRuleSchema } from '../ruleBreaches/validator.schema';

// POST /api/instances/entities
export const createEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
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
    }).unknown(true),
    query: {},
    params: { id: Joi.string().required() },
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

// POST /api/instances/entities/export
export const exportEntitiesSchema = Joi.object({
    body: {
        templateIds: Joi.array().items(Joi.string()).required(),
        fileName: Joi.string().required(),
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
