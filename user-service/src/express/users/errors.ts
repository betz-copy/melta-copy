import { ServiceError } from '../error';

export class UserDoesNotExistError extends ServiceError {
    constructor(userId: string) {
        super(404, `A user with id '${userId}' does not exist`);
    }
}
