import { PermissionTypeOptions, RelatedPermission } from '@microservices/shared';
import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { CompactNullablePermissionsSchema, SubCompactNullablePermissionSchema } from '../../utils/joi/schemas/permission/compact';

// GET /api/permissions/compact/find-by-related-id/:relatedId
export const getCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
        permissionType: joi.string().valid(RelatedPermission.User, RelatedPermission.Role).required(),
    },
    params: {
        relatedId: mongoIdSchema.required(),
    },
});

// POST /api/permissions/compact/sync
export const syncCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        relatedId: mongoIdSchema.required(),
        permissionType: joi.string().valid(RelatedPermission.User, RelatedPermission.Role).required(),
        permissions: CompactNullablePermissionsSchema.required(),
        dontDeleteUser: joi.boolean(),
    },
    params: {},
});

// PATCH /api/permissions/metadata
export const deletePermissionsFromMetadataRequestSchema = joi.object({
    query: {},
    body: {
        metadata: SubCompactNullablePermissionSchema.required(),
        query: {
            workspaceId: mongoIdSchema.required(),
            type: joi
                .string()
                .valid(...PermissionTypeOptions)
                .required(),
            relatedId: mongoIdSchema.optional(),
        },
    },
    params: {},
});
