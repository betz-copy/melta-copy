import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class UnitDoesNotExistError extends ServiceError {
    constructor(id: string) {
        super(StatusCodes.NOT_FOUND, `A unit with id '${id}' does not exist`);
    }
}

export class CyclicalTreeError extends ServiceError {
    constructor(id: string, parentId: string) {
        super(StatusCodes.BAD_REQUEST, `Changing unit with id '${id}' to parent with id '${parentId}' causes a cyclical tree`, { type: 'cyclical' });
    }
}

export class DisabledChildUnderEnabledParent extends ServiceError {
    constructor(id: string, parentId: string) {
        super(StatusCodes.BAD_REQUEST, `Parent ${parentId} is disabled but child ${id} is enabled`, { type: 'disabled' });
    }
}
