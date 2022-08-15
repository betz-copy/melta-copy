import * as joi from 'joi';

const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

// GET /api/notifications/my
export const getMyNotificationsRequestSchema = joi.object({
    query: {
        limit: joi.number().integer().min(1),
        step: joi.number().integer().min(0),
        type: joi.string(),
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
