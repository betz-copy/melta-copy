import * as Joi from 'joi';

// Get /api/preview/:fileId/:needsConversion
export const getPreviewSchema = Joi.object({
    body: {},
    params: {
        fileId: Joi.string().required(),
    },
    query: {
        contentType: Joi.string().required().default('document'),
    },
});
