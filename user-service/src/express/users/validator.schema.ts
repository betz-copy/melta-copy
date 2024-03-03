import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { CompactPermissionsSchema } from '../../utils/joi/schemas/permission/compact';
import { partialBaseUserSchema, userSchema } from '../../utils/joi/schemas/user';

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
        fullName: joi.string(),
        jobTitle: joi.string(),
        permissions: CompactPermissionsSchema,
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
