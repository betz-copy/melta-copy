/* eslint-disable max-classes-per-file */
import * as express from 'express';

export class ServiceError extends Error {
    public code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export class DocumentNotFoundError extends ServiceError {
    constructor(id: string) {
        super(404, `No workspace found with id ${id}`);
    }
}

export class PathDoesNotExistError extends ServiceError {
    constructor(path: string) {
        super(404, `No workspace found with path ${path}`);
    }
}

export class PathIsNotFolderError extends ServiceError {
    constructor(path: string) {
        super(404, `${path} is not a folder`);
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
        });
    } else {
        res.status(500).send({
            type: error.name,
            message: error.message,
        });
    }

    console.log('Request failed with error: ', error);

    next();
};
