import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';

// GET /api/users/:id
export const getUserByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        id: mongoIdSchema.required(),
    },
});
