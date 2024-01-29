import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../../express/error';
import config from '../../config';
import CategoriesController from '../../express/category/controller';
import DefaultController from './controller';
import DefaultManager from './manager';
import { ICategory } from '../../express/category/interface';

// export default function DefaultControllerMiddleware(controller: DefaultController<any, any>, funcName: string) {
// export function DefaultControllerMiddleware<U, T extends DefaultManager<U>>(
//     controller: DefaultControllerConstructor<U, T>,
//     manager: T,
//     funcName: string,
// ) {
//     return (req: Request, res: Response) => {
//         // Extract the db name from the request headers
//         const dbName = req.headers.dbName as string;

//         // Delete the dbName from the request headers
//         delete req.headers.dbName;

//         // Call the controller function
//         new controller(dbName)[funcName](req, res);
//     };
// }

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = PickMatching<T, Function>;
type a = keyof ExtractMethods<CategoriesController>;

export function addController<T>(controller: T, funcName: keyof ExtractMethods<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const dbName = req.headers[config.service.dbHeaderName];

        if (!dbName) return next(new ServiceError(400, 'No database name provided'));

        return new (controller as any)(dbName)[funcName](req, res, next).catch(next);
    };
}

// export function addController<T>(controller: T, funcName: keyof ExtractMethods<T>) {
//     return (req: Request, res: Response, next: NextFunction) => {
//         const dbName = req.headers[config.service.dbHeaderName];

//         if (!dbName) return next(new ServiceError(400, 'No database name provided'));

//         return new (controller as any)(dbName)[funcName](req, res, next).catch(next);
//     };
// }

export function addControllerBetterBetter<M extends DefaultManager<ICategory>, C extends DefaultController<ICategory, M>>(controller: C) {
    return (funcName: keyof InstanceType<typeof C>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const dbName = req.headers[config.service.dbHeaderName];

            if (!dbName) return next(new ServiceError(400, 'No database name provided'));

            return new (controller as any)(dbName)[funcName](req, res, next).catch(next);
        };
    };
}
// export function addControllerBetter<T>(controller: T) {
//     return <U>(funcName: keyof U) => {
//         return (req: Request, res: Response, next: NextFunction) => {
//             const dbName = req.headers[config.service.dbHeaderName];

//             if (!dbName) return next(new ServiceError(400, 'No database name provided'));

//             return new (controller as any)(dbName)[funcName](req, res, next).catch(next);
//         };
//     };
// }

export const wrapDefaultController = (funcName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.locals.controller[funcName](req, res, next).catch(next);
    };
};
