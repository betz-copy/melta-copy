import { NextFunction, Request, Response } from 'express';
import { config } from '../../config';
import { ServiceError } from '../../express/error';
import { FunctionKey } from '../types';
import DefaultController from './controller';

const { usersGlobalBucketName } = config.minio;
export const createController = <T extends InstanceType<typeof DefaultController<any>>>(Controller: { new (workspaceId: string): T }) => {
    return new Proxy(
        {},
        {
            get: (_, funcName: string) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    console.log('shirel', req.headers[config.service.workspaceIdHeaderName]);

                    const workspaceId = req.route.path.includes('/user-profile')
                        ? usersGlobalBucketName
                        : req.headers[config.service.workspaceIdHeaderName];

                    if (typeof workspaceId !== 'string') return next(new ServiceError(400, 'Invalid workspace id in header'));

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
