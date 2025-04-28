import * as Joi from 'joi';

// Get /api/preview/:fileId
// eslint-disable-next-line import/prefer-default-export
export const getPreviewSchema = Joi.object({
    body: {},
    params: {
        fileId: Joi.string().required(),
    },
    query: {
        contentType: Joi.string().required().default('document'),
    },
});
