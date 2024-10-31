import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { CompactNullablePermissionsSchema, SubCompactNullablePermissionSchema } from '../../utils/joi/schemas/permission/compact';
import { PermissionTypeOptions } from './interface';

// GET /api/permissions/compact/find-by-user-id/:userId
export const getCompactPermissionsOfUserRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        userId: mongoIdSchema.required(),
    },
});

// POST /api/permissions/compact/sync
export const syncCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        userId: mongoIdSchema.required(),
        permissions: CompactNullablePermissionsSchema.required(),
    },
    params: {},
});

// PATCH /api/permissions/metadata
export const deletePermissionsFromMetadataRequestSchema = joi.object({
    query: {},
    body: {
        metadata: SubCompactNullablePermissionSchema,
        query: {
            workspaceId: mongoIdSchema.required(),
            type: joi
                .string()
                .valid(...PermissionTypeOptions)
                .required(),
            userId: mongoIdSchema.optional(),
        },
    },
    params: {},
});
