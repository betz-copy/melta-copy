import * as Joi from 'joi';
import { resourceTypeOptions, scopeOptions } from './interface';

const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

const ScopeSchema = Joi.string().valid(...scopeOptions);
const ResourceTypeSchema = Joi.string().valid(...resourceTypeOptions);

// GET /api/permissions
export const getPermissionsRequestSchema = Joi.object({
    query: {
        userId: Joi.string(),
        resourceType: ResourceTypeSchema,
        category: Joi.string(),
    },
    body: {},
    params: {},
});

// GET /api/permissions/:id
export const getPermissionByIdRequestSchema = Joi.object({
    params: {
        id: MongoIdSchema.required(),
    },
    query: {},
    body: {},
});

// POST /api/permissions/:userId/authorization
export const checkUserAuthorizationRequestSchema = Joi.object({
    body: {
        resourceType: ResourceTypeSchema.required(),
        relatedCategories: Joi.array().items(Joi.string()).min(1).required(),
        operation: ScopeSchema.required(),
    },
    params: {
        userId: MongoIdSchema.required(),
    },
    query: {},
});

// POST /api/permissions/
export const createPermissionRequestSchema = Joi.object({
    body: {
        userId: MongoIdSchema.required(),
        resourceType: ResourceTypeSchema.required(),
        category: Joi.string().required(),
        scopes: Joi.array().items(ScopeSchema).min(1).required(),
    },
    query: {},
    params: {},
});

// PUT /api/permissions/:id
export const updatePermissionRequestSchema = Joi.object({
    body: Joi.object({
        resourceType: ResourceTypeSchema,
        scopes: Joi.array().items(ScopeSchema).min(1),
    }).min(1),
    params: {
        id: MongoIdSchema.required(),
    },
    query: {},
});

// DELETE /api/permissions/:id
export const deletePermissionRequestSchema = Joi.object({
    params: {
        id: MongoIdSchema.required(),
    },
    body: {},
    query: {},
});
