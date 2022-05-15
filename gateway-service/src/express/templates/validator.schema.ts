import * as Joi from 'joi';
import { MongoIdSchema, fileSchema, ColorSchema } from '../../utils/joi';

// POST /api/templates/categories
export const createCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        color: ColorSchema.required(),
    },
    params: {},
    file: fileSchema,
});

// PUT /api/templates/categories
export const updateCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        iconFileId: Joi.string().allow(null),
        color: ColorSchema,
    },
    params: {
        id: MongoIdSchema.required(),
    },
    file: fileSchema,
});

// DELETE /api/templates/categories/:id
export const deleteCategorySchema = Joi.object({
    query: {},
    body: {},
    params: {
        id: MongoIdSchema.required(),
    },
});

// POST /api/templates/entities
export const createEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        category: Joi.string().required(),
        disabled: Joi.boolean().default(false),
        properties: Joi.string().required(),
    },
    query: {},
    params: {},
    file: fileSchema,
});

// PUT /api/templates/entities/:id
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        category: Joi.string(),
        disabled: Joi.boolean(),
        properties: Joi.string(),
        iconFileId: Joi.string().allow(null),
    },
    query: {},
    params: {
        id: MongoIdSchema.required(),
    },
    file: fileSchema,
});

// DELETE /api/templates/entities/:id
export const deleteEntityTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { id: MongoIdSchema.required() },
});
