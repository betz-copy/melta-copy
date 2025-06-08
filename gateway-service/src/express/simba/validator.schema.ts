import Joi from 'joi';
import { MongoIdSchema } from '@microservices/shared';

// GET /api/simba/templates/all
export const getAllSimbaTemplatesSchema = Joi.object({
    query: {},
    body: {
        usersInfoChildTemplateId: MongoIdSchema.required(),
    },
    params: {},
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
        textSearch: Joi.string().allow(''),
        filter: Joi.object().optional(),
        showRelationships: Joi.alternatives(Joi.boolean(), Joi.array().items(Joi.string())).default(false),
        sort: Joi.any(),
    },
    params: {
        templateId: MongoIdSchema.required(),
    },
});
