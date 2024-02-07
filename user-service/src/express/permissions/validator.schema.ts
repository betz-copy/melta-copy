import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';

// GET /api/permissions
export const getPermissionsOfUserRequestSchema = joi.object({
    query: {
        userId: mongoIdSchema.required(),
    },
    body: {},
    params: {},
});
