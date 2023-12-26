import { Response, Request, NextFunction } from 'express';

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
