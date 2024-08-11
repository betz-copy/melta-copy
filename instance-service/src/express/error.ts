/* eslint-disable max-classes-per-file */
import express from 'express';
import logger from '../utils/logger/logsLogger';
import { StatusCodes } from 'http-status-codes';

export class ServiceError extends Error {
    constructor(public code: number, message: string, public metadata: object = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string) {
        super(StatusCodes.NOT_FOUND, message);
        this.name = 'NotFound';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string) {
        super(StatusCodes.BAD_REQUEST, message);
        this.name = 'TemplateValidationError';
    }
}

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error.name === 'ValidationError') {
        res.status(StatusCodes.BAD_REQUEST).send({
            type: error.name,
            message: error.message,
        });
    } else if (error instanceof ServiceError) {
        res.status(error.code).send({
            type: error.name,
            message: error.message,
            metadata: error.metadata,
        });
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
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
