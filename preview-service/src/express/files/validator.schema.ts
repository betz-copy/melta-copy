import * as Joi from 'joi';
import { FileExtensions } from './interface';

// Get /api/preview/:fileId/:needsConversion
export const getPreviewSchema = Joi.object({
    query: {
        token: Joi.string(),
        targetExtension: Joi.string()
            .valid(...Object.values(FileExtensions))
            .default(FileExtensions.pdf),
    },
    body: {},
    params: {
        fileId: Joi.string().required(),
        needsConversion: Joi.boolean(),
    },
});
