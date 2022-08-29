/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import config from '../../config';
import { createNotificationMessageSchema } from '../../rabbit/validator.schema';
import { notificationType } from './interface';

const { maxFindLimit } = config.mongo;

export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

// GET /api/notifications
export const getNotificationsRequestSchema = joi.object({
    query: {
        limit: joi.number().integer().min(1).max(maxFindLimit).required(),
        step: joi.number().integer().min(0).default(0),
        type: joi.string().valid(...notificationType),
        viewerId: mongoIdSchema,
    },
    body: {},
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
    body: createNotificationMessageSchema,
    params: {},
});

// PATCH /api/notifications/seen
export const notificationSeenRequestSchema = joi.object({
    query: {},
    body: {
        viewerId: mongoIdSchema.required(),
    },
    params: {
        notificationId: mongoIdSchema.required(),
    },
});
