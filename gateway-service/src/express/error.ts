import * as express from 'express';

export class ServiceError extends Error {
    constructor(public code: number, message: string, public metadata: object = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
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
    } else if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
        res.status(401).send({
            type: error.name,
            message: error.message,
        });
    } else {
        res.status(500).send({
            type: 'InternalServerError',
            message: 'internal server error',
        });

        // TODO: add some logging
        console.error('Request failed with error: ', error);
    }

    next();
};
