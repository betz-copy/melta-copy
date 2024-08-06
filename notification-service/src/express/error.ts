/* eslint-disable max-classes-per-file */
import * as express from 'express';
import { NotificationType } from './notifications/interface';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    public code;

    constructor(code: number, message: string, public metadata: object = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    /* istanbul ignore else */
    if (error.name === 'ValidationError') {
        res.status(400).send({
            type: error.name,
            message: error.message,
        });
    } else if (error instanceof ServiceError) {
        res.status(error.code).send({
            type: error.name,
            message: error.message,
        });
    } else {
        res.status(500).send({
            type: error.name,
            message: error.message,
        });
    }

    logger.error('error for handling new request', {
        error: {
            request: {
                method: req.method,
                url: req.url,
                body: req.body,
            },
            response: {
                status: res.statusCode,
                message: res.statusMessage,
            },
            ...error,
        },
    });
    next();
};

export class NotificationDoesNotExistError extends ServiceError {
    constructor(notificationId: string) {
        super(404, `A notification with the id '${notificationId}' does not exist`);
    }
}

/* istanbul ignore next */
export class InvalidNotificationTypeError extends ServiceError {
    constructor(type: NotificationType) {
        super(404, `'${type} is not a valid notification type`);
    }
}
