import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { FunctionKey } from '../types';
import DefaultController from './controller';

export const createController = <T extends InstanceType<typeof DefaultController<any, any>>>(controller: { new (dbName: string): T }) => {
    return (funcName: FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => Promise<void>>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const dbName = req.headers[config.service.dbHeaderName];
            if (typeof dbName !== 'string') return next(new ServiceError(400, 'Invalid database name in header'));

            return (new controller(dbName)[funcName] as Function)(req, res, next).catch(next); // eslint-disable-line new-cap
        };
    };
};
