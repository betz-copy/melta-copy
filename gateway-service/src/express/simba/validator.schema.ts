import Joi from 'joi';
import { fileSchema, MongoIdSchema } from '@microservices/shared';
import { ExtendedJoi } from '../../utils/joi';
import { brokenRuleSchema } from '../ruleBreaches/validator.schema';

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

// POST /api/simba/entities/expanded/:entityId
export const getExpandedEntityByIdRequestSchema = Joi.object({
    query: {},
    body: {
        expandedParams: Joi.object().pattern(Joi.string(), Joi.number().min(1)).default({}),
        options: Joi.object({
            templateIds: Joi.array().items(Joi.string()).required(),
        }),
    },
    params: {
        entityId: Joi.string().required(),
    },
});

// POST /api/simba/entities
export const createSimbaEntitySchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
        ignoredRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).default([]),
    }).unknown(true),
    query: {},
    params: {},
    files: Joi.array().items(fileSchema),
});
