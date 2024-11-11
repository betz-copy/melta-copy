import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../error';
import { PermissionType } from './interface';

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
