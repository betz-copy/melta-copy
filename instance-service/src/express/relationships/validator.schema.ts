import Joi from 'joi';

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
    params: {},
});

/**
 * DELETE /api/instances/relationships/:id
 */
export const deleteRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {
        ignoredRules: Joi.array()
            .items(
                Joi.object({
                    ruleId: Joi.string().required(),
                    relationshipsIds: Joi.array().items(Joi.string()).required(),
                }),
            )
            .default([]),
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
