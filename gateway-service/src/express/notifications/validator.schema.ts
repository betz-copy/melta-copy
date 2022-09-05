import * as joi from 'joi';
import { NotificationType } from '../../externalServices/notificationService';

const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

// GET /api/notifications/my
export const getMyNotificationsRequestSchema = joi.object({
    query: {
        limit: joi.number().integer().min(1).required(),
        step: joi.number().integer().min(0),
        type: joi.string().valid(...Object.values(NotificationType)),
    },
    body: {},
    params: {},
});

// GET /api/notifications/count
export const getMyNotificationCountRequestSchema = joi.object({
    query: {
        type: joi.string().valid(...Object.values(NotificationType)),
    },
    body: {},
    params: {},
});

// PATCH /api/notifications/:notificationId/seen
export const notificationSeenRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        notificationId: mongoIdSchema.required(),
    },
});
