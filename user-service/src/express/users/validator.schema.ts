import * as joi from 'joi';
import config from '../../config';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { SubCompactPermissionSchema } from '../../utils/joi/schemas/permission/compact';
import { partialBaseUserSchema, userSchema } from '../../utils/joi/schemas/user';
import { agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema, agGridTextFilterSchema } from './agGridValidator.schema';

const { maxFindLimit } = config.mongo;

// POST /api/users/find-by-id/:id
export const getUserByIdRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        id: mongoIdSchema.required(),
    },
});

// POST /api/users/find-by-external-id/:externalId
export const getUserByExternalIdRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        externalId: mongoIdSchema.required(),
    },
});

// POST /api/users/search
export const searchUsersRequestSchema = joi.object({
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

// POST /api/users
export const createUserRequestSchema = joi.object({
    query: {},
    body: userSchema.required(),
    params: {},
});

// PATCH /api/users/:id
export const updateUserRequestSchema = joi.object({
    query: {},
    body: partialBaseUserSchema.required(),
    params: {
        id: mongoIdSchema.required(),
    },
});

// PATCH /api/users/preferences/:id
export const updateUserPreferencesMetadataRequestSchema = joi.object({
    query: {},
    body: joi
        .object({
            darkMode: joi.boolean().default(false),
            mailsNotificationsTypes: joi.array().items(joi.string()).default([]),
        })
        .required(),
    params: {
        id: mongoIdSchema.required(),
    },
});

// PATCH /api/users/bulk
export const updateUsersBulkRequestSchema = joi.object({
    query: {},
    body: joi.object().pattern(mongoIdSchema, partialBaseUserSchema.required()),
    params: {},
});

// GET /api/users/search/:workspaceId
export const searchUsersByPermissionsSchema = joi.object({
    query: {
        search: joi.string(),
    },
    body: {},
    params: {
        workspaceId: joi.string().required(),
    },
});
