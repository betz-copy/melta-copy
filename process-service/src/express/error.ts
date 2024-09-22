// eslint-disable-next-line max-classes-per-file
import axios from 'axios';
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

export class ValidationError extends ServiceError {
    constructor(message: string) {
        super(StatusCodes.BAD_REQUEST, message);
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

export class NotFoundError extends ServiceError {
    constructor(type: 'process' | 'step', id: string) {
        const msg = `${type} with the id ${id} not found`;
        super(StatusCodes.NOT_FOUND, msg);
    }
}

export class TemplateNotFoundError extends NotFoundError {
    constructor(type: 'process' | 'step', id: string) {
        super(type, id);
        const msg = `${type} template with the id ${id} not found`;
        this.message = msg;
    }
}

export class InstancePropertiesValidationError extends ValidationError {
    constructor(errorMsg: string) {
        const msg = `properties does not match template schema: ${errorMsg}`;
        super(msg);
    }
}

export class StepLengthValidationError extends ValidationError {
    constructor() {
        const msg = `number of steps not matched template`;
        super(msg);
    }
}
export class StepsNotMatchedValidationError extends ValidationError {
    constructor(reqMethod: 'PUT' | 'POST', unmatchedStepsIds: string[]) {
        const msg =
            reqMethod === 'POST'
                ? `The next step template Ids do not match the steps from the process Template: ${unmatchedStepsIds}`
                : `The next step Ids are not part of this process: ${unmatchedStepsIds}`;
        super(msg);
    }
}

export class StepNotPartOfProcessError extends ValidationError {
    constructor(stepId: string, processId: string) {
        const msg = `${stepId} is not part of the process with the id: ${processId}`;
        super(msg);
    }
}

export class NoMatchingStepsError extends ServiceError {
    constructor() {
        super(StatusCodes.NOT_FOUND, 'No matching step Templates found');
    }
}
