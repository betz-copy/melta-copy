/* eslint-disable max-classes-per-file */
import express from 'express';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    constructor(public code: number, message: string, public metadata: object = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string) {
        super(404, message);
        this.name = 'NotFound';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string) {
        super(400, message);
        this.name = 'TemplateValidationError';
    }
}

export const errorMiddleware = (error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error.name === 'ValidationError') {
        res.status(400).send({
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
        res.status(500).send({
            type: error.name,
            message: error.message,
        });
    }

    logger.error('Request failed with error: ', error);

    next();
};
