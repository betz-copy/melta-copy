import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { FunctionKey } from '../../types';
import DefaultController from './controller';
import { BadRequestError } from './error';

export type MiddlewareFunction = (req: Request, res: Response, next?: NextFunction) => Promise<void>;

export const wrapMiddleware = (func: (req: Request, res?: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res)
            .then(() => next())
            .catch(next);
    };
};

export const wrapValidator = wrapMiddleware;

export const wrapController = (func: (req: Request, res: Response, next?: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res, next).catch(next);
    };
};

export const addPropertyToRequest = (req: any, key: string, value: any) => {
    req[key] = value;
};

export const fetchPropertyFromRequest = <T>(req: any, key: string): T => {
    return req[key];
};

export const createController = <T extends InstanceType<typeof DefaultController<any, any>>>(
    Controller: { new (workspaceId: string): T },
    isMiddleware = false,
) => {
    return new Proxy(
        {},
        {
            get: (_, funcName: string) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    const workspaceId = req.headers[config.service.workspaceIdHeaderName];

                    if (typeof workspaceId !== 'string') return next(new BadRequestError('Invalid workspace id in header'));

                    if (isMiddleware) return (new Controller(workspaceId)[funcName] as Function)(req, res, next).then(next).catch(next);

                    return (new Controller(workspaceId)[funcName] as Function)(req, res, next).catch(next);
                };
            },
        },
    ) as {
        [K in FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => Promise<void>>]: (
            req: Request,
            res: Response,
            next: NextFunction,
        ) => void;
    };
};

export type RequestWithQuery<Query> = Request<any, any, any, Query>;
