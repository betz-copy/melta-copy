import { PermissionScope } from '@packages/permission';
import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class InvalidWorkspaceHeaderError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'Invalid workspace id in header');
    }
}

export class UserNotFoundError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'User not found');
    }
}

export class UserNotAuthorizedError extends ServiceError {
    constructor() {
        super(StatusCodes.FORBIDDEN, 'User not authorized');
    }
}

export class UserIncorrectScopeError extends ServiceError {
    constructor(neededScope?: PermissionScope, userScope?: PermissionScope) {
        super(StatusCodes.FORBIDDEN, `User scope is ${userScope} but ${neededScope} is needed`);
    }
}
