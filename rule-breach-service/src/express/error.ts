/* eslint-disable max-classes-per-file */
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
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
            headers: req.headers,
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
