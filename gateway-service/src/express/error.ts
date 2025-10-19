import { StatusCodes } from 'http-status-codes';
import { PermissionScope, ServiceError } from '@microservices/shared';

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
