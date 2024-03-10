import { ServiceError } from '../error';

export class DigitalIdentitySourceDoesNotExistsError extends ServiceError {
    constructor(source: string, kartoffelId: string) {
        super(404, `Digital identity source '${source}' does not exist for external user ${kartoffelId}`);
    }
}
