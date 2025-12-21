/* eslint-disable import/prefer-default-export */

import Joi from 'joi';
import { ExtendedJoi } from '../../../utils/joi';

// PATCH: processes/instances/:processId/steps/:stepId
export const updateStepSchema = Joi.object({
    body: Joi.object({
        properties: ExtendedJoi.stringToObject(),
        status: Joi.string(),
        comments: Joi.string(),
    }).or('properties', 'status', 'comments'),
    query: {},
    params: {
        processId: MongoIdSchema.required(),
        stepId: MongoIdSchema.required(),
    },
    files: Joi.array().items(fileSchema),
});
