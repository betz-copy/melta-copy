import { NextFunction, Request, Response } from 'express';

// Error classes
export class ServiceError extends Error {
    statusCode: number;
    metadata?: any;
    constructor(statusCode: number | undefined, message: string, metadata?: any) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode || 500;
        this.metadata = metadata;
    }
}

export class BadRequestError extends ServiceError {
    constructor(message: string) {
        super(400, message);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends ServiceError {
    constructor(message: string) {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ServiceError {
    constructor(message: string) {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string) {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string) {
        super(422, message);
        this.name = 'ValidationError';
    }
}

// Error middleware
export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ServiceError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
};

// Controller wrappers
export const wrapController =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const wrapMiddleware =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const wrapValidator =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const extendedWrapController =
    <T = any>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
    async (_req: Request, res: Response, _next: NextFunction) => {
        try {
            const result = await fn(_req, res, _next);
            if (!res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            _next(error);
        }
    };

// Property management for request
const PROPERTY_KEY = Symbol('customProperties');

export const addPropertyToRequest = (req: Request, key: string, value: any) => {
    if (!(req as any)[PROPERTY_KEY]) {
        (req as any)[PROPERTY_KEY] = {};
    }
    (req as any)[PROPERTY_KEY][key] = value;
};

export const fetchPropertyFromRequest = <T = any>(req: Request, key: string): T | undefined => {
    return (req as any)[PROPERTY_KEY]?.[key];
};

// Controller creator with workspace support
type ControllerConstructor<T = any> = { new (workspaceId: string): T };

export const createController = <T extends object>(
    Controller: ControllerConstructor<T>,
    isMiddleware = false,
    workspaceIdHeaderName = 'x-workspace-id',
) => {
    return new Proxy(
        {},
        {
            get: (_, funcName: string) => {
                return async (req: Request, res: Response, next: NextFunction) => {
                    const workspaceId = req.headers[workspaceIdHeaderName] as string;

                    if (!workspaceId) {
                        next(new BadRequestError('Missing workspace ID header'));
                        return;
                    }

                    try {
                        const controller = new Controller(workspaceId);
                        const method = (controller as any)[funcName];

                        if (typeof method !== 'function') {
                            throw new Error(`Method ${funcName} not found on controller`);
                        }

                        if (isMiddleware) {
                            await method.call(controller, req, res, next);
                            next();
                        } else {
                            await method.call(controller, req, res, next);
                        }
                    } catch (error) {
                        next(error);
                    }
                };
            },
        },
    ) as T;
};

// Default controller class
export default abstract class DefaultController<Model = any, Manager = any> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }

    protected wrapAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
        return wrapController(fn);
    }

    protected wrapMiddleware(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
        return wrapMiddleware(fn);
    }
}
