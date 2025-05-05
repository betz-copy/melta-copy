import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

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
