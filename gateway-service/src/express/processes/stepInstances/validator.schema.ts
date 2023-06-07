import * as Joi from 'joi';
import { ExtendedJoi, MongoIdSchema, fileSchema } from '../../../utils/joi';

// PATCH: processes/instances/:processId/steps/:stepId
export const updateStepSchema = Joi.object({
    body: Joi.object({
        properties: ExtendedJoi.stringToObject(),
        status: Joi.string(),
    }).or('properties', 'status'),
    query: {},
    params: {
        processId: MongoIdSchema.required(),
        stepId: MongoIdSchema.required(),
    },
    files: Joi.array().items(fileSchema),
});
