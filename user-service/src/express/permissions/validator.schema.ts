import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { CompactNullablePermissionsSchema } from '../../utils/joi/schemas/permission/compact';

// GET /api/permissions/compact
export const getCompactPermissionsOfUserRequestSchema = joi.object({
    query: {},
    body: {
        workspaceIds: joi.array().items(mongoIdSchema.required()),
    },
    params: {
        userId: mongoIdSchema.required(),
    },
});

// POST /api/permissions/compact/update
export const syncCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        userId: mongoIdSchema.required(),
        permissions: CompactNullablePermissionsSchema.required(),
    },
    params: {},
});
