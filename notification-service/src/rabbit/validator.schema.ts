/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { notificationType } from '../express/notifications/interface';

export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const createNotificationMessageSchema = joi.object({
    viewers: joi.array().items(mongoIdSchema).required(),
    type: joi
        .string()
        .valid(...notificationType)
        .required(),
    metadata: joi.object().required(),
});
