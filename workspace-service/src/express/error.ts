import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export class DocumentNotFoundError extends ServiceError {
    constructor(id: string) {
        super(StatusCodes.NOT_FOUND, `No workspace found with id ${id}`);
    }
}

export class PathDoesNotExistError extends ServiceError {
    constructor(path: string) {
        super(StatusCodes.NOT_FOUND, `No workspace found with path ${path}`);
    }
}

export class PathIsNotFolderError extends ServiceError {
    constructor(path: string) {
        super(StatusCodes.NOT_FOUND, `${path} is not a folder`);
    }
}

export class WorkspaceUnderRootMustBeDirError extends ServiceError {
    constructor() {
        super(StatusCodes.BAD_REQUEST, 'Workspace under root must be a directory');
    }
}
