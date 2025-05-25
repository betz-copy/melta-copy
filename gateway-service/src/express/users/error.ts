import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

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
