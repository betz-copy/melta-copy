import { ServiceError } from '../error';

export class DigitalIdentitySourceDoesNotExistsError extends ServiceError {
    constructor(source: string, kartoffelId: string) {
        super(404, `Digital identity source '${source}' does not exist for external user ${kartoffelId}`);
    }
}

export class KartoffelUserMissingDataError extends ServiceError {
    constructor(kartoffelId: string) {
        super(404, `Kartoffel user '${kartoffelId}' is missing data`);
    }
}
