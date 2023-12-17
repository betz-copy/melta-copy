import * as Joi from 'joi';

// Get /api/preview/:fileId/:needsConversion
export const getPreviewSchema = Joi.object({
    query: {
        token: Joi.string(),
    },
    body: {},
    params: {
        fileId: Joi.string().required(),
        needsConversion: Joi.boolean(),
    },
});
