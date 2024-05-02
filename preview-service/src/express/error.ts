import * as express from 'express';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    constructor(public code: number, message: string) {
        super(message);
    }
}

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

    logger.error(
        'error for handling new request',
        req.method,
        req.url,
        req.body,
        'response(status, message):',
        res.statusCode,
        res.statusMessage,
        error,
    );

    next();
};
