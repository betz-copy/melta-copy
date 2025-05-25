import joi from 'joi';
import { MongoIdSchema } from '@microservices/shared';

// GET /api/notifications/my
export const getMyNotificationsRequestSchema = joi.object({
    query: {
        types: joi.array().items(joi.string()),
        startDate: joi.date(),
        endDate: joi.date(),
        limit: joi.number().integer().min(1).required(),
        step: joi.number().integer().min(0),
    },
    body: {},
    params: {},
});

// GET /api/notifications/count
export const getMyNotificationCountRequestSchema = joi.object({
    query: {
        types: joi.array().items(joi.string()),
    },
    body: {},
    params: {},
});

// POST /api/notifications/group-count
export const getMyNotificationGroupCountRequestSchema = joi.object({
    query: {},
    body: {
        groups: joi.object().required(),
    },
    params: {},
});

// POST /api/notifications/:notificationId/seen
export const notificationSeenRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        notificationId: MongoIdSchema.required(),
    },
});

// POST /api/notifications/:notificationId/seen
export const manyNotificationSeenRequestSchema = joi.object({
    query: {},
    body: {
        types: joi.array().items(joi.string()),
    },
    params: {},
});
