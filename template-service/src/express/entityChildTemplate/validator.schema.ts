import { MongoIdSchema, searchFilterSchema, variableNameValidation } from '@microservices/shared';
import Joi from 'joi';

const childTemplatePropertySchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().required(),
    format: Joi.string(),
    defaultValue: Joi.any(),
    filters: searchFilterSchema.custom((value) => {
        // todo: upgrade mongo version up to 5 and then delete that convert
        if (value) return JSON.stringify(value);
        return value;
    }),
    isEditableByUser: Joi.boolean(),
});

const childEntityTemplateSchema = {
    name: variableNameValidation.required(),
    displayName: Joi.string().required(),
    description: Joi.string(),
    fatherTemplateId: MongoIdSchema.required(),
    categories: Joi.array().items(MongoIdSchema).required(),
    properties: Joi.object().pattern(Joi.string(), childTemplatePropertySchema).required(),
    disabled: Joi.boolean().default(false),
    actions: Joi.string(),
    viewType: Joi.string().valid('categoryPage', 'userPage').required(),
    isFilterByCurrentUser: Joi.boolean().default(false),
    filterByCurrentUserField: Joi.string(),
    isFilterByUserUnit: Joi.boolean().default(false),
};

// POST /api/templates/child/search
export const searchEntityChildTemplatesSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        categoryIds: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});

// GET /api/templates/child
export const getAllChildTemplatesSchema = Joi.object({
    query: {},
    body: {},
    params: {},
});

// POST /api/templates/child
export const createEntityChildTemplateSchema = Joi.object({
    body: {
        ...childEntityTemplateSchema,
    },
    query: {},
    params: {},
});

// GET /api/templates/child/:id
export const getChildTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// PUT /api/templates/child/:id
export const updateEntityChildTemplateSchema = Joi.object({
    body: {
        ...childEntityTemplateSchema,
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// GET /api/templates/child/search-by-user
export const searchEntityChildTemplatesByUserSchema = Joi.object({
    query: {},
    body: {
        kartoffelId: Joi.string().required(),
        childTemplateId: Joi.string().required(),
    },
    params: {},
});

// DELETE /api/templates/child/:id
export const deleteEntityChildTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
});
