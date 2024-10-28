// eslint-disable-next-line max-classes-per-file
import axios from 'axios';
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger/logsLogger';

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

export class InstanceNotFoundError extends ServiceError {
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
