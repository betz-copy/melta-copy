/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';

// POST /api/semantic/search
export const search = joi.object({
    query: {},
    body: joi.object({
        textSearch: joi.string().required(),
        limit: joi.number().default(12),
        skip: joi.number().default(0),
        templates: joi.array().items(joi.string()).required(),
    }),
    params: {},
});
