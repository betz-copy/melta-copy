import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { validateCompactNullablePermissions } from '../../utils/joi/schemas/permission';

// GET /api/permissions/compact
export const getCompactPermissionsOfUserRequestSchema = joi.object({
    query: {
        userId: mongoIdSchema.required(),
    },
    body: {},
    params: {},
});

// POST /api/permissions/compact/update
export const updateCompactPermissionsRequestSchema = joi.object({
    query: {},
    body: {
        userId: mongoIdSchema.required(),
        permissions: validateCompactNullablePermissions.required(),
    },
    params: {},
});
