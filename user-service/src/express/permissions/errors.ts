import { ServiceError } from '../error';
import { PermissionType } from './interface';

export class SinglePermissionOfTypePerUserError extends ServiceError {
    constructor(type: PermissionType) {
        super(400, `A user should only have a single permission of type '${type}'`);
    }
}

export class UnknownPermissionTypeError extends ServiceError {
    constructor(type: string) {
        super(404, `Unknown permission type '${type}'`);
    }
}
