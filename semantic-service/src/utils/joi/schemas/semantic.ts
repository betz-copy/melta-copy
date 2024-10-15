import * as Joi from 'joi';

export const semanticIndexFilesSchema = Joi.object({
    minio_file_ids: Joi.array().items(Joi.string()).required(),
    template_id: Joi.string().required(),
    entity_id: Joi.string().required(),
});
