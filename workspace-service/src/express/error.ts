/* eslint-disable max-classes-per-file */
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    public code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export class DocumentNotFoundError extends ServiceError {
    constructor(id: string) {
        super(StatusCodes.NOT_FOUND, `No workspace found with id ${id}`);
    }
}

export class PathDoesNotExistError extends ServiceError {
    constructor(path: string) {
        super(StatusCodes.NOT_FOUND, `No workspace found with path ${path}`);
    }
}

export class PathIsNotFolderError extends ServiceError {
    constructor(path: string) {
        super(StatusCodes.NOT_FOUND, `${path} is not a folder`);
    }
}

export class WorkspaceUnderRootMustBeDirError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'Workspace under root must be a directory');
    }
}

export const errorMiddleware = (error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
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

    logger.error('Request failed with error: ', error);

    next();
};
