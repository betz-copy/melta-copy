import * as Joi from 'joi';

export const defaultSchema = Joi.object({
    query: {
        token: Joi.string(),
    },
    body: {},
    params: {
        path: Joi.string().required(),
    },
});

// POST /api/uploadFile/
export const uploadFileRequestSchema = Joi.object({
    file: Joi.required(),
    query: {},
    params: {},
});
