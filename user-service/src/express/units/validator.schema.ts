import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';

// GET /api/units
export const getUnitsRequestSchema = joi.object({
    query: {
        name: joi.string(),
        parentId: mongoIdSchema,
        workspaceIds: joi.array().items(mongoIdSchema).min(1).required(),
        disabled: joi.boolean(),
    },
    body: {},
    params: {},
});

// POST /api/units/ids
export const getUnitsByIdsRequestSchema = joi.object({
    query: {},
    body: { ids: joi.array().items(mongoIdSchema.required()).required() },
    params: {},
});

// POST /api/units
export const createUnitRequestSchema = joi.object({
    query: {},
    body: {
        name: joi.string().required(),
        parentId: mongoIdSchema.allow('', null).empty('').default(null),
        workspaceId: mongoIdSchema.required(),
        disabled: joi.boolean().default(false),
    },
    params: {},
});

// PATCH /api/units/:id
export const updateUnitRequestSchema = joi.object({
    query: {},
    body: {
        name: joi.string(),
        parentId: mongoIdSchema.allow('', null).empty(''),
        disabled: joi.boolean(),
        shouldEffectChildren: joi.boolean(),
    },
    params: {
        id: mongoIdSchema.required(),
    },
});

// GET /api/units/:workspaceId/hierarchy
export const getUnitHierarchyRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        workspaceId: mongoIdSchema.required(),
    },
});
