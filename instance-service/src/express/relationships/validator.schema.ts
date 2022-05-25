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
 * POST /api/instances/relationships
 */
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

/**
 * DELETE /api/instances/relationships/:id
 */
export const deleteRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {},
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
