import { NextFunction, Request, Response } from 'express';
import { get } from 'lodash';
import { dataLogger } from '@microservices/shared';
import config from '../../config';
import { InvalidWorkspaceHeaderError } from '../../express/error';
import WorkspaceService from '../../express/workspaces/service';

const { workspaceIdHeaderName } = config.service;

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
                status: res.status,
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

export const translateWorkspaceParameter = async (req: Request) => {
    req.headers[config.service.workspaceIdHeaderName] = req.params.workspaceId;
};
