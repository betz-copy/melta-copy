import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { FunctionKey } from '../types';
import DefaultController from './controller';

export const createController = <T extends InstanceType<typeof DefaultController<any, any>>>(Controller: { new (workspaceId: string): T }) => {
    return new Proxy(
        {},
        {
            get: (_, funcName: string) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    const workspaceId = req.headers[config.service.workspaceIdHeaderName];

                    if (typeof workspaceId !== 'string') return next(new ServiceError(StatusCodes.BAD_REQUEST, 'Invalid workspace id in header'));

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
