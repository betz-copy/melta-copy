import Joi from 'joi';

export const semanticIndexFilesSchema = Joi.object({
    minioFileIds: Joi.array().items(Joi.string()).required(),
    templateId: Joi.string().required(),
    entityId: Joi.string().required(),
});

export const semanticDeleteFilesSchema = Joi.object({
    minioFileIds: Joi.array().items(Joi.string()).required(),
});
