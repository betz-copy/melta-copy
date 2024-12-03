import joi from 'joi';
import { PermissionType } from '../../externalServices/userService/interfaces/permissions';
import { MongoIdSchema } from '../../utils/joi';

const UserExternalMetadataSchema = joi.object({
    kartoffelId: joi.string().required(),
    digitalIdentitySource: joi.string().required(),
});

// GET /api/users/my
export const getMyUserRequestSchema = joi.object({
    query: {},
    body: {},
    params: {},
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
        workspaceIds: joi.array().items(MongoIdSchema.required()),
        limit: joi.number().integer().required(),
        step: joi.number().integer(),
        filterModel: joi.object(),
        sortModel: joi.array().items(
            joi.object({
                colId: joi.string(),
                sort: joi.string(),
            }),
        ),
    },
    params: {},
});

// POST /api/users
export const createUserRequestSchema = joi.object({
    query: {},
    body: UserExternalMetadataSchema.keys({
        permissions: joi.object(),
    }).required(),
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

// PATCH /api/permissions/metadata
export const deletePermissionsFromMetadataRequestSchema = joi.object({
    query: {},
    body: {
        metadata: joi.object(),
        query: {
            workspaceId: MongoIdSchema.required(),
            type: joi
                .string()
                .valid(...Object.values(PermissionType))
                .required(),
            userId: MongoIdSchema.optional(),
        },
    },
    params: {},
});

// GET /api/users/external
export const searchExternalUsersRequestSchema = joi.object({
    query: {
        search: joi.string().required(),
        workspaceId: MongoIdSchema,
    },
    body: {},
    params: {},
});
