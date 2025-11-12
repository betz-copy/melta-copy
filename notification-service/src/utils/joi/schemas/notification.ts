import { NotificationType } from '@microservices/shared';
import * as joi from 'joi';
import { clientSideIdSchema, mongoIdSchema } from '.';
import { validateNotificationMetadataSchema } from './notificationMetadata';

export const notificationSchema = joi.object({
    viewers: joi.array().items(mongoIdSchema).min(1).required(),
    type: joi
        .string()
        .valid(...Object.values(NotificationType))
        .required(),
    metadata: validateNotificationMetadataSchema,
});

export const basicNotificationSearchSchema = joi.object({
    types: joi
        .array()
        .items(joi.string().valid(...Object.values(NotificationType)))
        .min(1),
    viewerId: joi.alternatives().try(mongoIdSchema, clientSideIdSchema).required(),
    startDate: joi.date(),
    endDate: joi.date().greater(joi.ref('startDate')),
});
