import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { UserPreferencesSchema } from '../../utils/joi/schemas/user';

// GET /api/users/:id
export const getUserByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        id: mongoIdSchema.required(),
    },
});

// PATCH /api/users/:id/preferences
export const updateUserPreferencesByIdRequestSchema = joi.object({
    query: {},
    body: UserPreferencesSchema.required(),
    params: {
        id: mongoIdSchema.required(),
    },
});
