import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { FunctionKey } from '../types';
import DefaultController from './controller';

export const wrapMiddleware = (func: (req: Request, res?: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res)
            .then(() => next())
            .catch(next);
    };
};

export const wrapValidator = wrapMiddleware;

export const wrapController = <ExtendedRequest extends Request<any, any, any, any> = Request, ExtendedResponse extends Response = Response>(
    func: (req: ExtendedRequest, res: ExtendedResponse, next?: NextFunction) => Promise<void>,
) => {
    return (req: ExtendedRequest, res: ExtendedResponse, next: NextFunction) => {
        func(req, res, next).catch(next);
    };
};
export const addPropertyToRequest = (req: any, key: string, value: any) => {
    req[key] = value;
};

export const fetchPropertyFromRequest = <T>(req: any, key: string): T => {
    return req[key];
};

export const createController = <T extends InstanceType<typeof DefaultController<any>>>(
    controller: { new (dbName: string): T },
    isMiddleware = false,
) => {
    return (funcName: FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => Promise<void>>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const dbName = req.headers[config.service.dbHeaderName];
            if (typeof dbName !== 'string') return next(new ServiceError(400, 'Invalid database name in header'));

            if (isMiddleware) {
                return (new controller(dbName)[funcName] as Function)(req, res, next)
                    .then(() => next())
                    .catch(next); // eslint-disable-line new-cap
            }

            return (new controller(dbName)[funcName] as Function)(req, res, next).catch(next); // eslint-disable-line new-cap
        };
    };
};

export type RequestWithQuery<Query> = Request<any, any, any, Query>;
