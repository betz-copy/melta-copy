import Joi from 'joi';

// GET /api/relationships/:id
export const getRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// POST /api/relationships
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

// DELETE /api/relationships/:id
export const deleteRelationshipByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: Joi.string().required(),
    },
});

// PUT /api/relationships/:id
export const updateRelationshipByIdRequestSchema = Joi.object({
    body: {
        properties: Joi.object(),
    },
    query: {},
    params: {
        id: Joi.string().required(),
    },
});
