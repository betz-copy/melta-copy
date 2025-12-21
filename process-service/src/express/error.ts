import { NotFoundError, ServiceError, ValidationError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class InstanceNotFoundError extends ServiceError {
    constructor(type: 'process' | 'step', id: string) {
        const msg = `${type} with the id ${id} not found`;
        super(StatusCodes.NOT_FOUND, msg);
    }
}

export class TemplateNotFoundError extends NotFoundError {
    constructor(type: 'process' | 'step', id: string) {
        super(type, { id });
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
