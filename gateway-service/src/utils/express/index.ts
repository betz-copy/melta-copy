import { Request, Response, NextFunction } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import DefaultController from './controller';
import { FunctionKey } from '../types';
import { InvalidWorkspaceHeaderError } from '../../express/error';
import config from '../../config';
import { WorkspaceService } from '../../express/workspaces/service';

const { workspaceHeaderName, dbHeaderName } = config.service;

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

export type RequestWithQuery<Query> = Request<any, any, any, Query>;

export const getDbName = async (req: Request) => {
    const workspaceId = req.headers[workspaceHeaderName];

    if (typeof workspaceId !== 'string') throw new InvalidWorkspaceHeaderError();
    await WorkspaceService.getById(workspaceId); // check if workspace exists

    return workspaceId;
};

export const createWorkspacesController = <T extends InstanceType<typeof DefaultController<any>>>(controller: {
    new (dbName: string, userId: string): T;
}) => {
    return (funcName: FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => Promise<void>>) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const dbName = await getDbName(req);
            return (new controller(dbName, req.user!.id)[funcName] as Function)(req, res, next).catch(next); // eslint-disable-line new-cap
        };
    };
};

export const createWorkspacesProxyMiddleware = (options: Options) => {
    return createProxyMiddleware({
        ...options,
        onProxyReq: async (...params) => {
            const [proxyReq, req] = params;

            const dbName = await getDbName(req);
            proxyReq.setHeader(dbHeaderName, dbName);

            if (options.onProxyReq) options.onProxyReq(...params);
        },
    });
};
