import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { SubCompactPermissionSchema } from '../../utils/joi/schemas/permission/compact';
import { partialBaseUserSchema, userSchema } from '../../utils/joi/schemas/user';
import { config } from '../../config';

const { maxFindLimit } = config.mongo;

// GET /api/users/:id
export const getUserByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        id: mongoIdSchema.required(),
    },
});

// POST /api/users/search
export const searchUsersRequestSchema = joi.object({
    query: {},
    body: joi.object({
        search: joi.string(),
        permissions: SubCompactPermissionSchema,
        limit: joi.number().integer().min(1).max(maxFindLimit).required(),
        step: joi.number().integer().min(0).default(0),
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

// PATCH /api/users/bulk
export const updateUsersBulkRequestSchema = joi.object({
    query: {},
    body: joi.object().pattern(mongoIdSchema, partialBaseUserSchema.required()),
    params: {},
});
