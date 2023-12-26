import Joi from 'joi';

// GET /api/users/search?fullName=
export const searchUsersRequestSchema = Joi.object({
    params: {},
    query: {
        search: Joi.string().required(),
    },
    body: {},
});

// GET /api/users/:userId
export const getUserById = Joi.object({
    params: { userId: Joi.string().required() },
    query: {},
    body: {},
});
