import * as joi from 'joi';
import { partialBaseRoleSchema, roleSchema } from '../../utils/joi/schemas/role';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { SubCompactPermissionSchema } from '../../utils/joi/schemas/permission/compact';
import config from '../../config';
import { agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema, agGridTextFilterSchema } from '../users/agGridValidator.schema';

const { maxFindLimit } = config.mongo;

// POST /api/roles/find-by-id/:id
export const getRoleByIdRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        id: mongoIdSchema.required(),
    },
});

// POST /api/roles/search
export const searchRolesRequestSchema = joi.object({
    query: {},
    body: joi.object({
        permissions: SubCompactPermissionSchema,
        workspaceIds: joi.array().items(mongoIdSchema.required()),
        limit: joi.number().integer().min(1).max(maxFindLimit).required(),
        step: joi.number().integer().min(0).default(0),
        search: joi.string(),
        filterModel: joi
            .object()
            .pattern(/^/, joi.alternatives(agGridTextFilterSchema, agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema)),
        sortModel: joi.array().items(
            joi.object({
                colId: joi.string(),
                sort: joi.string().valid('asc', 'desc'),
            }),
        ),
    }),
    params: {},
});

// POST /api/roles
export const createRoleRequestSchema = joi.object({
    query: {},
    body: roleSchema.required(),
    params: {},
});

// PATCH /api/roles/:id
export const updateRoleRequestSchema = joi.object({
    query: {},
    body: partialBaseRoleSchema.required(),
    params: {
        id: mongoIdSchema.required(),
    },
});

// PATCH /api/roles/bulk
export const updateRolesBulkRequestSchema = joi.object({
    query: {},
    body: joi.object().pattern(mongoIdSchema, partialBaseRoleSchema.required()),
    params: {},
});

// GET /api/roles/search/:workspaceId
export const searchRolesByPermissionsSchema = joi.object({
    query: {},
    body: {},
    params: {
        workspaceId: joi.string().required(),
    },
});

// POST /api/roles/workspaces
export const getAllWorkspaceRolesSchema = joi.object({
    query: {},
    body: { workspaceIds: joi.array().items(joi.string()).required() },
    params: {},
});

// POST /api/roles/userRoleWorkspace/:workspaceId
export const userRoleWorkspaceSchema = joi.object({
    query: {},
    body: { roleIds: joi.array().items(joi.string()).required() },
    params: {
        workspaceId: joi.string().required(),
    },
});
