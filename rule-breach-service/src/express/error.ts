/* eslint-disable max-classes-per-file */
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    public code;

    constructor(
        code: number,
        message: string,
        public metadata: object = {},
    ) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    /* istanbul ignore else */
    if (error.name === 'ValidationError') {
        res.status(StatusCodes.BAD_REQUEST).send({
            type: error.name,
            message: error.message,
        });
    } else if (error instanceof ServiceError) {
        res.status(error.code).send({
            type: error.name,
            message: error.message,
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

export class RuleBreachDoesNotExistError extends ServiceError {
    constructor(ruleBreach: string, type: 'alert' | 'request') {
        super(StatusCodes.NOT_FOUND, `A rule breach ${type} with the id '${ruleBreach}' does not exist`);
    }
}

export class RuleBreachSearchFilterTypeError extends ServiceError {
    constructor(filterType: string) {
        super(StatusCodes.NOT_FOUND, `A filter of type '${filterType}' does not exist`);
    }
}
