import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '@microservices/shared';

// eslint-disable-next-line import/prefer-default-export
export class UserDoesNotExistError extends ServiceError {
    constructor(userId: string) {
        super(StatusCodes.NOT_FOUND, `A user with id '${userId}' does not exist`);
    }
}
