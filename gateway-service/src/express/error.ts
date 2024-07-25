import axios from 'axios';
import express from 'express';

import logger from '../utils/logger/logsLogger';

export class ServiceError extends Error {
    constructor(public code: number, message: string, public metadata: any = {}) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}

const formatAxiosErrorData = (axiosErrorData: object & { message?: string; metadata?: object }) => {
    if (axiosErrorData.message?.includes('E11000')) {
        return { ...axiosErrorData, errorCode: 'DUPLICATE_ERROR' };
    }

    if (axiosErrorData.metadata) {
        return {
            ...axiosErrorData,
            ...axiosErrorData.metadata,
        };
    }

    return axiosErrorData;
};

export const errorMiddleware = async (error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error.name === 'ValidationError') {
        res.status(400).send({
            type: error.name,
            message: error.message,
        });
    } else if (error instanceof ServiceError) {
        res.status(error.code).send({
            type: error.name,
            message: error.message,
            metadata: error.metadata,
        });
    } else if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
        res.status(401).send({
            type: error.name,
            message: error.message,
        });
    } else if (axios.isAxiosError(error) && error.response?.status) {
        res.status(error.response?.status).send({
            type: error.name,
            message: error.message,
            metadata: formatAxiosErrorData(error.response.data),
        });
    } else {
        res.status(500).send({
            type: 'InternalServerError',
            message: 'internal server error',
        });

        logger.error('Request failed with error: ', { error });
    }

    next();
};

export class InvalidWorkspaceHeaderError extends ServiceError {
    constructor() {
        super(400, 'Invalid workspace id in header');
    }
}

export class UserNotFoundError extends ServiceError {
    constructor() {
        super(400, 'User not found');
    }
}

export class UserNotAuthorizedError extends ServiceError {
    constructor() {
        super(403, 'User not authorized');
    }
}
