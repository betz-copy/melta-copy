import { MongoIdSchema, variableNameValidation } from '@microservices/shared';
import Joi from 'joi';

// format of properties keys in entity template

const nativeDataTypeSchema = Joi.alternatives(Joi.boolean(), Joi.string(), Joi.number());

const filterOfFieldSchema = Joi.object({
    $eq: nativeDataTypeSchema.allow(null),
    $ne: nativeDataTypeSchema.allow(null),
    $eqi: Joi.string(),
    $rgx: Joi.string(), // regex syntax of Neo4j (Java Regular Expression). validated by neo itself
    $gt: nativeDataTypeSchema,
    $gte: nativeDataTypeSchema,
    $lt: nativeDataTypeSchema,
    $lte: nativeDataTypeSchema,
    $in: Joi.alternatives(
        Joi.array().items(Joi.boolean().allow(null)),
        Joi.array().items(Joi.string().allow(null)),
        Joi.array().items(Joi.number().allow(null)),
    ),
    $not: Joi.link('#filterOfField'),
})
    .min(1)
    .id('filterOfField');

const filterOfTemplateSchema = Joi.object().pattern(Joi.string(), filterOfFieldSchema).min(1);
const searchFilterSchema = Joi.object({
    $and: Joi.alternatives(filterOfTemplateSchema, Joi.array().items(filterOfTemplateSchema).min(1)),
    $or: Joi.array().items(filterOfTemplateSchema).min(1),
}).min(1);

// POST /api/templates/entities/child/search
export const searchEntityChildTemplatesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        fatherTemplatesIds: Joi.array().items(MongoIdSchema),
    },
    params: {},
});

// GET /api/templates/entities/child
export const getAllChildTemplatesSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

// POST /api/templates/entities/child
export const createEntityChildTemplateSchema = Joi.object({
    body: {
        name: variableNameValidation.required(),
        displayName: Joi.string().required(),
        description: Joi.string(),
        fatherTemplate: MongoIdSchema.required(),
        categories: Joi.array().items(MongoIdSchema).required(),
        propertiesFilters: Joi.object()
            .pattern(Joi.string(), {
                filter: searchFilterSchema,
            })
            .default({}),
        disabled: Joi.boolean().default(false),
        actions: Joi.string(),
        viewType: Joi.string().valid('categoryPage', 'userPage').required(),
        filterByCurrentUser: Joi.boolean().default(false),
        filterByUserUnit: Joi.boolean().default(false),
    },
    query: {},
    params: {},
});
