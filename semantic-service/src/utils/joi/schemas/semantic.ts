import * as Joi from 'joi';

export const semanticIndexFilesSchema = Joi.object({
    workspaceId: Joi.string().required(),
    minioFileIds: Joi.array().items(Joi.string()).required(),
    templateId: Joi.string().required(),
    entityId: Joi.string().required(),
});

export const semanticDeleteFilesSchema = Joi.object({
    workspaceId: Joi.string().required(),
    minioFileIds: Joi.array().items(Joi.string()).required(),
});
