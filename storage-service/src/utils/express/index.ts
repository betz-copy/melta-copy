import { NextFunction, Request, Response } from 'express';
import { config } from '../../config';
import { ServiceError } from '../../express/error';
import { FunctionKey } from '../types';
import DefaultController from './controller';

export const createController = <T extends InstanceType<typeof DefaultController>>(controller: { new (dbName: string): T }) => {
    return (funcName: FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => any>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const dbName = req.headers[config.service.dbHeaderName];
            if (typeof dbName !== 'string') return next(new ServiceError(400, 'Invalid database name in header'));

            return (new controller(dbName)[funcName] as Function)(req, res, next).catch(next); // eslint-disable-line new-cap
        };
    };
};

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
