// eslint-disable-next-line max-classes-per-file
import * as express from 'express';
import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    public code;

    constructor(code: number, message: string, public metadata: object = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string) {
        super(400, message);
        this.name = 'TemplateValidationError';
    }
}

export const errorMiddleware = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export class NotFoundError extends ServiceError {
    constructor(type: 'process' | 'step', id: string) {
        const msg = `${type} with the id ${id} not found`;
        super(404, msg);
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
        super(404, 'No matching step Templates found');
    }
}
