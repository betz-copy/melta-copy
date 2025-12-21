import { PermissionType } from '@packages/permission';
import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class SinglePermissionOfTypePerUserError extends ServiceError {
    constructor(type: PermissionType) {
        super(StatusCodes.BAD_REQUEST, `A user should only have a single permission of type '${type}'`);
    }
}

export class UnknownPermissionTypeError extends ServiceError {
    constructor(type: string) {
        super(StatusCodes.NOT_FOUND, `Unknown permission type '${type}'`);
    }
}
