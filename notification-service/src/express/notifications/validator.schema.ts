/* eslint-disable import/prefer-default-export */

import { NotificationType } from '@microservices/shared';
import * as joi from 'joi';
import config from '../../config';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { basicNotificationSearchSchema, notificationSchema } from '../../utils/joi/schemas/notification';

const { maxFindLimit } = config.mongo;

// GET /api/notifications
export const getNotificationsRequestSchema = joi.object({
    query: basicNotificationSearchSchema.keys({
        limit: joi.number().integer().min(1).max(maxFindLimit).required(),
        step: joi.number().integer().min(0).default(0),
        startDate: joi.date(),
        endDate: joi.date(),
    }),
    body: {},
    params: {},
});

// GET /api/notifications/count
export const getNotificationCountRequestSchema = joi.object({
    query: basicNotificationSearchSchema,
    body: {},
    params: {},
});

// POST /api/notifications/group-count
export const getNotificationGroupCountRequestSchema = joi.object({
    query: {},
    body: basicNotificationSearchSchema.keys({
        types: joi.forbidden(),
        groups: joi
            .object()
            .pattern(
                joi.string(),
                joi
                    .array()
                    .items(joi.string().valid(...Object.values(NotificationType)))
                    .min(1),
            )
            .required(),
    }),
    params: {},
});

// GET /api/notifications/:id
export const getNotificationByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        notificationId: mongoIdSchema.required(),
    },
});

// POST /api/notifications
export const createNotificationRequestSchema = joi.object({
    query: {},
    body: notificationSchema,
    params: {},
});

// POST /api/notifications/:notificationId/seen
export const notificationSeenRequestSchema = joi.object({
    query: {},
    body: {
        viewerId: mongoIdSchema.required(),
    },
    params: {
        notificationId: mongoIdSchema.required(),
    },
});

// POST /api/notifications/seen
export const manyNotificationSeenRequestSchema = joi.object({
    query: {},
    body: basicNotificationSearchSchema.keys({
        viewerId: mongoIdSchema.required(),
    }),
    params: {},
});
