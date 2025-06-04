import Joi from 'joi';
import { MongoIdSchema } from '@microservices/shared';

// GET /api/simba/all
export const getAllTemplatesSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

// GET /api/simba/templates/all
export const getAllSimbaTemplatesSchema = Joi.object({
    query: {},
    body: {
        usersInfoChildTemplateId: MongoIdSchema.required(),
    },
    params: {},
});

// GET /api/simba/relationships/:templateId
export const getAllRelationshipTemplatesSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/simba/entities/:templateId
export const getInstancesByTemplateIdSchema = Joi.object({
    query: {},
    body: {
        kartoffelId: Joi.string().required(),
    },
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// GET /api/simba/templates/child/:templateId
export const getEntityChildTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/simba/entities/count
export const countEntitiesOfTemplatesByUserEntityIdSchema = Joi.object({
    query: {},
    body: {
        templateIds: Joi.array().items(MongoIdSchema).required(),
        userEntityId: Joi.string().required(),
    },
});

// POST /api/simba/entities/search/template/:templateId
export const searchEntitiesOfTemplateSchema = Joi.object({
    query: {},
    body: {
        userEntityId: Joi.string().optional(),
        skip: Joi.number().optional(),
        limit: Joi.number().optional(),
        textSearch: Joi.string().optional(),
        filter: Joi.object().optional(),
        showRelationships: Joi.array().items(MongoIdSchema).optional(),
        sort: Joi.array()
            .items(Joi.object({ field: Joi.string().required(), sort: Joi.string().required() }))
            .optional(),
    },
    params: {
        templateId: MongoIdSchema.required(),
    },
});
