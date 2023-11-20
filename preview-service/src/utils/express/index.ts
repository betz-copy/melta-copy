import { Response, Request, NextFunction } from 'express';

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
