import * as Joi from 'joi';

const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

// GET /api/categories/:categoryId
export const getCategoryByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// GET /api/categories/
// GET /api/categories?search=name
export const getCategoriesSchema = Joi.object({
    query: { search: Joi.string() },
    body: {},
    params: {},
});

// POST /api/categories
export const createCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
    },
    params: {},
    file: Joi.object(),
});

// DELETE /api/categories/:categoryId
export const deleteCategorySchema = Joi.object({
    query: {},
    body: {},
    params: {
        categoryId: MongoIdSchema.required(),
    },
});

// PUT /api/categories
export const updateCategorySchema = Joi.object({
    query: {},
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        file: Joi.allow(null),
    },
    params: {
        categoryId: MongoIdSchema.required(),
    },
    file: Joi.object(),
});
