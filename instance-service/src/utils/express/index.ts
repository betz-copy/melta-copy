import { Response, Request, NextFunction } from 'express';

export const wrapMiddleware = (func: (req: Request, res?: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res)
            .then(() => next())
            .catch(next);
    };
};

export const wrapMiddlewareSync = (func: (req: Request, res?: Response) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            func(req, res);
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const wrapValidator = wrapMiddleware;

export const wrapController = (func: (req: Request, res: Response, next?: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res, next).catch(next);
    };
};
