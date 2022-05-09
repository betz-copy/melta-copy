import * as Joi from 'joi';

// GET /api/users/search?fullName=
export const searchUsersRequestSchema = Joi.object({
    params: {},
    query: {
        fullName: Joi.string().required(),
    },
    body: {},
});
