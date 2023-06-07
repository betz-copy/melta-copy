// eslint-disable-next-line max-classes-per-file
import { ServiceError } from '../error';

export class StepNotPartOfProcess extends ServiceError {
    constructor(stepId: string, processName: string) {
        super(400, `step '${stepId}' is not part of process '${processName}'`);
    }
}

export class StepNotEditable extends ServiceError {
    constructor(stepId: string) {
        super(400, `step '${stepId}' cannot be edited`);
    }
}

export class NotFoundError extends ServiceError {
    constructor(type: 'process template' | 'process' | 'step', id: string) {
        const msg = `${type} with the id ${id} not found`;
        super(404, msg);
    }
}
