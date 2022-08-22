/* eslint-disable max-classes-per-file */
import * as express from 'express';

export class ServiceError extends Error {
    public code;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export const errorMiddleware = (error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    /* istanbul ignore else */
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

    next();
};

export class RuleBreachDoesNotExistError extends ServiceError {
    constructor(ruleBreach: string) {
        super(404, `A rule breach with the id '${ruleBreach}' does not exist`);
    }
}

export class RuleBreachRequestDoesNotExistError extends ServiceError {
    constructor(ruleBreachRequestId: string) {
        super(404, `A rule breach request with the id '${ruleBreachRequestId}' does not exist`);
    }
}

export class RuleBreachSearchFilterTypeError extends ServiceError {
    constructor(filterType: string) {
        super(404, `A filter of type '${filterType}' does not exist`);
    }
}
