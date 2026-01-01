import * as Joi from 'joi';

// GET /api/activityLog/:entityId
export const getActivitySchema = Joi.object({
    query: {
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        actions: Joi.array().items(Joi.string()).default([]),
        searchText: Joi.string().default(''),
        fieldsSearch: Joi.array().items(Joi.string()).default([]),
        usersSearch: Joi.array().items(Joi.string()).default([]),
        startDateRange: Joi.date(),
        endDateRange: Joi.date(),
    },
    body: {},
    params: {
        entityId: Joi.string().required(),
    },
});
