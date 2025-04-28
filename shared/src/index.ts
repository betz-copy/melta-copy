export * from '@microservices/shared-interfaces';

export * from './utils/express';
export { default as logger } from './utils/logger/logsLogger';
export { default as dataLogger } from './utils/logger/dataLogger';

export {
    createController,
    wrapController,
    wrapMiddleware,
    wrapValidator,
    extendedWrapController,
    addPropertyToRequest,
    fetchPropertyFromRequest,
} from './utils/express';
export { ServiceError, NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError, errorMiddleware } from './utils/express/error';
export { default as DefaultController } from './utils/express/controller';

export { default as DefaultManagerMongo } from './utils/mongo/manager';
