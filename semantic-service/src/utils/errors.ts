import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class NoFilesError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'No files provided');
    }
}

export class OpenAIError extends ServiceError {
    constructor(message: string) {
        super(StatusCodes.BAD_REQUEST, message);
    }
}
