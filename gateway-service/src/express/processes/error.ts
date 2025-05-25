// eslint-disable-next-line max-classes-per-file
import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class StepNotPartOfProcess extends ServiceError {
    constructor(stepId: string, processName: string) {
        super(StatusCodes.BAD_REQUEST, `step '${stepId}' is not part of process '${processName}'`);
    }
}

export class StepNotEditable extends ServiceError {
    constructor(stepId: string) {
        super(StatusCodes.BAD_REQUEST, `step '${stepId}' cannot be edited`);
    }
}

export class EntityNotExist extends ServiceError {
    constructor(entityId: string) {
        super(StatusCodes.BAD_REQUEST, `entity with id '${entityId}' not exist`);
    }
}

export class NotFoundError extends ServiceError {
    constructor(type: 'process template' | 'process' | 'step', id: string) {
        const msg = `${type} with the id ${id} not found`;
        super(StatusCodes.NOT_FOUND, msg);
    }
}
