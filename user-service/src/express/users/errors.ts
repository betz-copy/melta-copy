import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class UserDoesNotExistError extends ServiceError {
    constructor(userId: string) {
        super(StatusCodes.NOT_FOUND, `A user with id '${userId}' does not exist`);
    }
}
