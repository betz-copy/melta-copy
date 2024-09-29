import axios from 'axios';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { PermissionScope } from '../externalServices/userService/interfaces/permissions';

import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    constructor(public code: number, message: string, public metadata: any = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string, public metadata: object = {}) {
        super(StatusCodes.NOT_FOUND, message);
        this.name = 'NotFound';
        this.metadata = metadata;
    }
}

export class ForbiddenError extends ServiceError {
    constructor(message: string, public metadata: object = {}) {
        super(StatusCodes.FORBIDDEN, message);
        this.name = 'Forbidden';
        this.metadata = metadata;
    }
}

export class BadRequestError extends ServiceError {
    constructor(message: string, public metadata: object = {}) {
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

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let statusCode: number;
    let errorResponse: any;
    if (error.name === 'ValidationError') {
        statusCode = StatusCodes.BAD_REQUEST;
        errorResponse = {
            type: error.name,
            message: error.message,
        };
    } else if (error instanceof ServiceError) {
        statusCode = error.code;
        errorResponse = {
            type: error.name,
            message: error.message,
            metadata: error.metadata,
        };
    } else if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
        statusCode = StatusCodes.UNAUTHORIZED;
        errorResponse = {
            type: error.name,
            message: error.message,
        };
    } else if (axios.isAxiosError(error) && error.response?.status) {
        statusCode = error.response.status;
        errorResponse = {
            type: error.name,
            message: error.response.data?.message || error.message,
            responseMessage: error.response.statusText,
            metadata: formatAxiosErrorData(error.response.data),
        };
    } else {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        errorResponse = {
            type: 'InternalServerError',
            message: error.message || 'Internal server error',
        };
    }
    const logData = {
        error: {
            message: error.message,
            name: error.name,
            ...(error instanceof ServiceError && { metadata: error.metadata }),
            ...(axios.isAxiosError(error) && {
                responseData: error.response?.data,
                code: error.code,
                config: {
                    method: error.config?.method,
                    url: error.config?.url,
                    headers: error.config?.headers,
                },
            }),
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            workspaceId: req.headers.workspaceId,
            host: req.headers.host,
            body: req.body,
        },
        response: {
            status: statusCode,
            errorResponse,
        },
    };
    logger.error('Error handling request', logData);
    res.status(statusCode).send(errorResponse);
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
