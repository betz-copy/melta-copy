import { ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class NoFilesError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'No files provided');
    }
}

export class OpenAIError extends ServiceError {
    constructor(message: string) {
        super(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
}
