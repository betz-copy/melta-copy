import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import logger from '../logger/logsLogger';

export class ServiceError extends Error {
    public code: number;

    constructor(
        code: number | undefined,
        message: string,
        public metadata: object = {},
    ) {
        super(message);
        this.code = code || StatusCodes.INTERNAL_SERVER_ERROR;
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

export class UnauthorizedError extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.UNAUTHORIZED, message);
        this.name = 'unauthorized';
        this.metadata = metadata;
    }
}

export class ValidationError extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.BAD_REQUEST, message, metadata);
        this.name = 'TemplateValidationError';
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

const errorResponseBuilder = (error: ServiceError) => {
    return {
        type: error.name,
        message: error.message,
        StatusCodes: error.code,
        ...(error.metadata && { metadata: error.metadata }),
    };
};

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let statusCode: number;
    let errorResponse: any;

    switch (error.constructor) {
        case BadRequestError:
            statusCode = (error as BadRequestError).code;
            errorResponse = errorResponseBuilder(error as BadRequestError);
            break;

        case ServiceError:
            statusCode = (error as ServiceError).code;
            errorResponse = errorResponseBuilder(error as ServiceError);
            break;

        case UnauthorizedError:
            statusCode = (error as UnauthorizedError).code;
            errorResponse = errorResponseBuilder(error as UnauthorizedError);
            break;

        default:
            if (axios.isAxiosError(error) && error.response?.status) {
                statusCode = error.response.status;
                errorResponse = errorResponseBuilder({ ...error, code: error.response.status, metadata: formatAxiosErrorData(error.response.data) });
            } else {
                statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
                errorResponse = errorResponseBuilder(error as ServiceError);
            }
            break;
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
