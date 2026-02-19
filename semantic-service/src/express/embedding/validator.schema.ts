import * as joi from 'joi';

// POST /api/semantic/embedding/search
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

// POST /api/semantic/embedding/rerank
export const rerank = joi.object({
    query: {},
    body: joi.object({
        query: joi.string().required(),
        texts: joi.array().items(joi.string()).required(),
    }),
    params: {},
});
