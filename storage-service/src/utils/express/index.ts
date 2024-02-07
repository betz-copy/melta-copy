import { NextFunction, Request, Response } from 'express';
import { config } from '../../config';
import { ServiceError } from '../../express/error';

export function createController<T>(controller: T) {
    return <U>(funcName: keyof U) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const dbName = req.headers[config.service.dbHeaderName];

            if (!dbName) return next(new ServiceError(400, 'No database name provided'));

            return new (controller as any)(dbName)[funcName](req, res, next).catch(next);
        };
    };
}

export const wrapValidator = (func: (req: Request, res: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res).then(next).catch(next);
    };
};

export const wrapController = (func: (req: Request, res: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res).catch(next);
    };
};
