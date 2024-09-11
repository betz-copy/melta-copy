import axios from 'axios';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { PermissionScope } from '../externalServices/userService/interfaces/permissions';

import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    constructor(
        public code: number,
        message: string,
        public metadata: any = {},
    ) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export class NotFoundError extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.NOT_FOUND, message);
        this.name = 'NotFound';
        this.metadata = metadata;
    }
}

export class ForbiddenError extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.FORBIDDEN, message);
        this.name = 'Forbidden';
        this.metadata = metadata;
    }
}

export class BadRequestError extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.BAD_REQUEST, message);
        this.name = 'badRequest';
        this.metadata = metadata;
    }
}

const formatAxiosErrorData = (axiosErrorData: object & { message?: string; metadata?: object }) => {
    if (axiosErrorData.message?.includes('E11000')) {
        return { ...axiosErrorData, errorCode: 'DUPLICATE_ERROR' };
    }

    if (axiosErrorData.metadata) {
        return {
            ...axiosErrorData,
            ...axiosErrorData.metadata,
        };
    }

    return axiosErrorData;
};

export const errorMiddleware = async (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    } else if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
        res.status(StatusCodes.UNAUTHORIZED).send({
            type: error.name,
            message: error.message,
        });
    } else if (axios.isAxiosError(error) && error.response?.status) {
        res.status(error.response?.status).send({
            type: error.name,
            message: error.message,
            metadata: formatAxiosErrorData(error.response.data),
        });
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            type: 'InternalServerError',
            message: 'internal server error',
        });

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
    }

    next();
};

export class InvalidWorkspaceHeaderError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'Invalid workspace id in header');
    }
}

export class UserNotFoundError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'User not found');
    }
}

export class UserNotAuthorizedError extends ServiceError {
    constructor() {
        super(StatusCodes.FORBIDDEN, 'User not authorized');
    }
}

export class UserIncorrectScopeError extends ServiceError {
    constructor(neededScope?: PermissionScope, userScope?: PermissionScope) {
        super(StatusCodes.FORBIDDEN, `User scope is ${userScope} but ${neededScope} is needed`);
    }
}
