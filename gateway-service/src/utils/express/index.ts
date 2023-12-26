import { Request, Response, NextFunction } from 'express';

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
