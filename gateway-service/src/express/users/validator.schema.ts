import joi from 'joi';
import { PermissionType } from '../../externalServices/userService/interfaces/permissions';
import { MongoIdSchema } from '../../utils/joi';

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

const UserPreferencesMetadataSchema = joi.object({
    darkMode: joi.boolean(),
    // mailsNotificationsTypes: joi.array().items(NotificationType),
    mailsNotificationsTypes: joi.array().items(joi.string()),
});

export const baseUserSchema = joi.object({
    fullName: joi.string().required(),
    jobTitle: joi.string().required(),
    hierarchy: joi.string().required(),
    mail: joi.string().required(),
    externalMetadata: joi
        .object({
            kartoffelId: joi.string().required(),
            digitalIdentitySource: joi.string().required(),
        })
        .required(),
    preferences: joi
        .object({
            darkMode: joi.boolean(),
            // mailsNotificationsTypes: joi.array().items(NotificationType),
            mailsNotificationsTypes: joi.array().items(joi.string()),
        })
        .required(),
});
export const partialBaseUserSchema = partialSchema(baseUserSchema);

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
        workspaceId: MongoIdSchema,
        limit: joi.number().integer().required(),
        step: joi.number().integer(),
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

// PATCH /api/users/:id/preferences
export const updateUserPreferencesMetadataRequestSchema = joi.object({
    query: {},
    body: UserPreferencesMetadataSchema.required(),
    params: {
        userId: joi.string().required(),
    },
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
