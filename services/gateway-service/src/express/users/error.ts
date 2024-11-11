import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../error';

export class DigitalIdentitySourceDoesNotExistsError extends ServiceError {
    constructor(source: string, kartoffelId: string) {
        super(StatusCodes.NOT_FOUND, `Digital identity source '${source}' does not exist for external user ${kartoffelId}`);
    }
}

export class KartoffelUserMissingDataError extends ServiceError {
    constructor(kartoffelId: string) {
        super(StatusCodes.NOT_FOUND, `Kartoffel user '${kartoffelId}' is missing data`);
    }
}
