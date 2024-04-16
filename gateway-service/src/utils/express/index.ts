import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import { get } from 'lodash';
import dataLogger from '../logger/dataLogger';

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
    toLog: boolean = false,
    logRequestFields: Array<{ key: string; path: string }> = [],
    indexName: string = 'gateway',
    responseDataExtractor: ((body: any) => any) | undefined = undefined,
) => {
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
            const loggedResponseData = responseDataExtractor ? responseDataExtractor(body) : body;

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
