import { NextFunction, Request, Response } from 'express';
import { get } from 'lodash';
import config from '../../config';
import { InvalidWorkspaceHeaderError } from '../../express/error';
import { WorkspaceService } from '../../express/workspaces/service';
import dataLogger from '../logger/dataLogger';
import { FunctionKey } from '../types';
import DefaultController from './controller';

const { workspaceIdHeaderName } = config.service;

export const wrapMiddleware = (func: (req: Request, res?: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res)
            .then(() => next())
            .catch(next);
    };
};

export const wrapValidator = wrapMiddleware;

interface IWrapControllerOptions {
    toLog: boolean;
    logRequestFields: Array<{ key: string; path: string }>;
    indexName: string;
    responseDataExtractor: ((body: any) => any) | undefined;
}

const defaultWrapControllerOptions: IWrapControllerOptions = {
    toLog: false,
    logRequestFields: [],
    indexName: 'gateway',
    responseDataExtractor: undefined,
};

export const wrapController = <ExtendedRequest extends Request<any, any, any, any> = Request, ExtendedResponse extends Response = Response>(
    func: (req: ExtendedRequest, res: ExtendedResponse, next?: NextFunction) => Promise<void>,
    options: IWrapControllerOptions = defaultWrapControllerOptions,
) => {
    const { toLog, logRequestFields, indexName, responseDataExtractor } = { ...options };
    return (req: ExtendedRequest, res: ExtendedResponse, next: NextFunction) => {
        if (!toLog) {
            func(req, res, next).catch(next);
            return;
        }

        const originalJson = res.json.bind(res);
        const loggedRequestData: Record<string, any> = {};

        logRequestFields.forEach(({ key, path }) => {
            loggedRequestData[key] = get(req, path);
        });

        res.json = (body: any) => {
            const loggedResponseData = JSON.parse(JSON.stringify(responseDataExtractor ? responseDataExtractor(body) : body));

            if (loggedResponseData?._id) {
                const docId = loggedResponseData._id;
                delete loggedResponseData._id;
                loggedResponseData.docId = docId;
            }

            dataLogger.info(indexName, {
                userId: req.user?.id,
                path: req.path,
                method: req.method,
                ...loggedRequestData,
                ...loggedResponseData,
            });

            return originalJson(body);
        };
        func(req, res, next).catch((error) => {
            res.json = originalJson;
            next(error);
        });
    };
};

export type RequestWithQuery<Query> = Request<any, any, any, Query>;

export const getWorkspaceId = async (req: Request) => {
    const workspaceId = req.headers[workspaceIdHeaderName];

    if (typeof workspaceId !== 'string') throw new InvalidWorkspaceHeaderError();
    await WorkspaceService.getById(workspaceId); // check if workspace exists

    return workspaceId;
};

export const createWorkspacesController = <T extends InstanceType<typeof DefaultController<any>>>(
    controller: { new (workspaceId: string, userId: string): T },
    isMiddleware = false,
) => {
    return (funcName: FunctionKey<T, (req: Request, res: Response, next?: NextFunction) => Promise<void>>) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const workspaceId = await getWorkspaceId(req).catch(next);
            if (!workspaceId) return;

            if (isMiddleware) {
                return (new controller(workspaceId, req.user!.id)[funcName] as Function)(req, res, next)
                    .then(() => next())
                    .catch(next); // eslint-disable-line new-cap
            }

            return (new controller(workspaceId, req.user!.id)[funcName] as Function)(req, res, next).catch(next); // eslint-disable-line new-cap
        };
    };
};
