/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';

// POST /api/semantic/search
export const search = joi.object({
    query: {},
    body: joi.object({
        search_text: joi.string().required(),
        limit: joi.number().required(),
        skip: joi.number().required(),
        templates: joi.array().items(joi.string()).required(),
    }),
    params: {},
});
