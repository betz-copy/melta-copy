import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { CompactNullablePermissionsSchema, SubCompactNullablePermissionSchema } from '../../utils/joi/schemas/permission/compact';
import { PermissionTypeOptions } from '../permissions/interface';

// GET /api/permissions/compact/find-by-role-name/:roleName
export const getCompactPermissionsOfRoleRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        roleName: joi.string().required(),
    },
});

// POST /api/permissions/compact/sync
export const syncCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        name: joi.string().required(),
        permissions: CompactNullablePermissionsSchema.required(),
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
            name: joi.string().required(),
        },
    },
    params: {},
});
