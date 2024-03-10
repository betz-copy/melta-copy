import joi from 'joi';

const UserExternalMetadataSchema = joi.object({
    kartoffelId: joi.string().required(),
    digitalIdentitySource: joi.string().required(),
});

// GET /api/users/:userId
export const getUserByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        userId: joi.string().required(),
    },
});

// POST /api/users/search
export const searchUsersRequestSchema = joi.object({
    query: {},
    body: {
        search: joi.string(),
        permissions: joi.object(),
        limit: joi.number().integer().required(),
        step: joi.number().integer(),
    },
    params: {},
});

// PATCH /api/users/:userId/external
export const updateUserExternalMetadataRequestSchema = joi.object({
    query: {},
    body: UserExternalMetadataSchema.required(),
    params: {
        userId: joi.string().required(),
    },
});

// POST /api/users/:userId/permissions/sync
export const syncUserPermissionsRequestSchema = joi.object({
    query: {},
    body: joi.object(),
    params: {
        userId: joi.string().required(),
    },
});

// GET /api/users/external
export const searchExternalUsersRequestSchema = joi.object({
    query: {
        search: joi.string().required(),
    },
    body: {},
    params: {},
});
