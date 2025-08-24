import joi from 'joi';
import { PermissionType, iconFileSchema, MongoIdSchema } from '@microservices/shared';
import { ExtendedJoi } from '../../utils/joi';
import config from '../../config';

const { profilePathPattern } = config.userService;

export const partialSchema = (schema: joi.ObjectSchema) => {
    const keys = Object.keys(schema.describe().keys);

    return schema.fork(keys, (keySchema) =>
        keySchema.describe().type === 'object' ? partialSchema(keySchema as joi.ObjectSchema) : keySchema.optional(),
    );
};

const UserExternalMetadataSchema = joi.object({
    kartoffelId: joi.string().required(),
    digitalIdentitySource: joi.string().required(),
});

const UserRoleIdsSchema = joi.object({
    permissions: joi.object(),
    roleIds: joi.array().items(joi.string()),
});

const UserPreferencesMetadataSchema = joi.object({
    darkMode: ExtendedJoi.boolean(),
    mailsNotificationsTypes: ExtendedJoi.stringToArray(),
    profilePath: joi.string().pattern(profilePathPattern).messages({
        'string.pattern.base': 'profilePath must start with a valid UUID, or kartoffelProfile string',
    }),
});

const RoleSchema = joi.object({
    name: joi.string().required(),
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

// GET /api/users/kartoffelUserProfile/:kartoffelId
export const getKartoffelUserProfileRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        kartoffelId: joi.string().required(),
    },
});

// GET /api/users/kartoffelUser/:kartoffelId
export const getKartoffelUserByIdSchema = joi.object({
    query: {},
    body: {},
    params: {
        kartoffelId: MongoIdSchema.required(),
    },
});

// GET /api/users/user-profile/:userId
export const getUserProfileRequestSchema = joi.object({
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

// PATCH /api/users/:userId/roleIds
export const updateUserRoleIdsRequestSchema = joi.object({
    query: {},
    body: UserRoleIdsSchema.keys({
        workspaceId: joi.string(),
    }).required(),
    params: {
        userId: joi.string().required(),
    },
});

// PATCH /api/users/:userId/units
export const updateUserUnitsRequestSchema = joi.object({
    query: {},
    body: {
        units: joi.any(),
        workspaceId: joi.string(),
    },
    params: {
        userId: joi.string().required(),
    },
});

// POST /api/users
export const createUserRequestSchema = joi.object({
    query: {},
    body: UserExternalMetadataSchema.keys({
        permissions: joi.object(),
        workspaceId: joi.string(),
        roleIds: joi.array().items(joi.string()),
        units: joi.any(),
    }).required(),
    params: {},
});

// PATCH /api/users/:id/preferences
export const updateUserPreferencesMetadataRequestSchema = joi.object({
    query: {},
    body: UserPreferencesMetadataSchema.required(),
    params: {
        userId: MongoIdSchema.required(),
    },
    file: iconFileSchema,
});

// PATCH /api/users/:userId/external
export const updateUserExternalMetadataRequestSchema = joi.object({
    query: {},
    body: UserExternalMetadataSchema.required(),
    params: {
        userId: joi.string().required(),
    },
});

// POST /api/users/:relatedId/permissions/sync
export const syncPermissionsRequestSchema = joi.object({
    query: {},
    body: joi.object(),
    params: {
        relatedId: joi.string().required(),
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
            relatedId: MongoIdSchema.optional(),
        },
    },
    params: {},
});

// GET /api/users/external
export const searchExternalUsersRequestSchema = joi.object({
    query: {
        search: joi.string().required(),
        workspaceId: MongoIdSchema,
        isKartoffelUser: joi.boolean().default(false),
    },
    body: {},
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

// GET /api/users/roles/:roleId
export const getRoleByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        roleId: joi.string().required(),
    },
});

// POST /api/users/roles/search
export const searchRolesRequestSchema = joi.object({
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

// POST /api/users/roles
export const createRoleRequestSchema = joi.object({
    query: {},
    body: RoleSchema.keys({
        permissions: joi.object(),
    }).required(),
    params: {},
});

// PATCH /api/users/roles/:roleId
export const updateRoleRequestSchema = joi.object({
    query: {},
    body: RoleSchema.required(),
    params: {
        roleId: joi.string().required(),
    },
});

// GET /api/users/roles/search/:workspaceId
export const searchRolesByPermissionsSchema = joi.object({
    query: {},
    body: {},
    params: {
        workspaceId: joi.string().required(),
    },
});

// POST /api/users/userRoleWorkspace/:workspaceId
export const userRoleWorkspaceRequestSchema = joi.object({
    query: {},
    body: { roleIds: joi.array().items(joi.string()).required() },
    params: {
        workspaceId: joi.string().required(),
    },
});

// POST /api/users/roles/workspaces
export const getAllWorkspaceRolesSchema = joi.object({
    query: {},
    body: { workspaceIds: joi.array().items(joi.string()).required() },
    params: {},
});
