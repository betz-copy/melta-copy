import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class RoleDoesNotExistError extends ServiceError {
    constructor(roleId: string) {
        super(StatusCodes.NOT_FOUND, `A role with id '${roleId}' does not exist`);
    }
}
