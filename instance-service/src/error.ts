import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

class FilterValidation extends ServiceError {
    constructor(
        message: string,
        public metadata: object = {},
    ) {
        super(StatusCodes.BAD_REQUEST, message, metadata);
        this.name = 'FilterValidationError';
    }
}

export default FilterValidation;
