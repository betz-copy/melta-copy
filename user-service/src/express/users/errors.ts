import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line import/prefer-default-export
export class UserDoesNotExistError extends ServiceError {
    constructor(userId: string) {
        super(StatusCodes.NOT_FOUND, `A user with id '${userId}' does not exist`);
    }
}
