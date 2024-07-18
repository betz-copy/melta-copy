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


// POST /api/files
export const uploadFileRequestSchema = Joi.object({
    file: Joi.required(),
    query: {},
    params: {},
});

// POST /api/files/bulk
export const uploadFilesRequestSchema = Joi.object({
    files: Joi.required(),
    query: {},
    params: {},
});

// POST /api/files/delete-bulk
// POST /api/files/duplicate-bulk
export const bulkFilesRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        paths: Joi.array().items(Joi.string()).required(),
    },
});
