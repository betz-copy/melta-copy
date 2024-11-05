import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../error';

export class UserDoesNotExistError extends ServiceError {
    constructor(userId: string) {
        super(StatusCodes.NOT_FOUND, `A user with id '${userId}' does not exist`);
    }
}
