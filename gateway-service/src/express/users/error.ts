import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class ExternalUserNotFound extends ServiceError {
    constructor(kartoffelId: string) {
        super(StatusCodes.NOT_FOUND, `${kartoffelId} not found`);
    }
}

export class KartoffelUserMissingDataError extends ServiceError {
    constructor(kartoffelId: string) {
        super(StatusCodes.NOT_FOUND, `Kartoffel user '${kartoffelId}' is missing data`);
    }
}
