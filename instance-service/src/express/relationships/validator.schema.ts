import Joi from 'joi';
import { brokenRuleSchema } from '../rules/ignoredRuleSchema';

/**
 * GET /api/instances/relationships/:id
 */
export const getRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

/**
 * GET /api/instances/relationships/count?templateId
 */
export const getRelationshipsCountRequestSchema = Joi.object({
    query: {
        templateId: Joi.string().required(),
    },
    body: {},
    params: {},
});

/**
 * POST /api/instances/relationships
 */
export const createRelationshipRequestSchema = Joi.object({
    body: {
        relationshipInstance: {
            templateId: Joi.string().required(),
            properties: Joi.object(),
            sourceEntityId: Joi.string().required(),
            destinationEntityId: Joi.string().required(),
        },
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
    },
    query: {},
    params: {},
});

/**
 * DELETE /api/instances/relationships/:id
 */
export const deleteRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
    },
    params: {
        id: Joi.string().required(),
    },
});

/**
 * PUT /api/instances/relationships/:id
 */
export const updateRelationshipByIdRequestSchema = Joi.object({
    body: {
        properties: Joi.object(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});

export const getRelationshipsByIdsRequestSchema = Joi.object({
    body: {
        ids: Joi.array().items(Joi.string()).required(),
    },
    query: {},
    params: {},
});

export const getRelationshipsByEntitiesAndTemplate = Joi.object({
    body: {},
    query: {
        sourceEntityId: Joi.string().required(),
        destinationEntityId: Joi.string().required(),
        templateId: Joi.string().required(),
    },
    params: {},
});

// POST /api/instances/relationships/user-entity-id
export const getRelationshipsByUserEntityIdRequestSchema = Joi.object({
    body: {
        relationshipTemplateIds: Joi.array().items(Joi.string()).required(),
        userEntityId: Joi.string().required(),
    },
    query: {},
    params: {},
});
