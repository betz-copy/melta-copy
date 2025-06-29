import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import SimbaController from './controller';
import {
    getInstancesByTemplateIdSchema,
    countEntitiesOfTemplatesByUserEntityIdSchema,
    getAllSimbaTemplatesSchema,
    searchEntitiesOfTemplateSchema,
    getExpandedEntityByIdRequestSchema,
    createSimbaEntitySchema,
} from './validator.schema';
import SimbaValidator from './middlewares';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';
import {
    getMyNotificationGroupCountRequestSchema,
    getMyNotificationsRequestSchema,
    manyNotificationSeenRequestSchema,
} from '../notifications/validator.schema';

const SimbaRouter: Router = Router();

const SimbaControllerMiddleware = createController(SimbaController);
const SimbaValidatorMiddleware = createController(SimbaValidator, true);

SimbaRouter.post(
    '/templates/all',
    ValidateRequest(getAllSimbaTemplatesSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getAllSimbaTemplates,
);

SimbaRouter.post(
    '/entities/:templateId',
    ValidateRequest(getInstancesByTemplateIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getInstancesByTemplateId,
);

SimbaRouter.post(
    '/entities/count/user-entity-id',
    ValidateRequest(countEntitiesOfTemplatesByUserEntityIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.countEntitiesOfTemplatesByUserEntityId,
);

SimbaRouter.post(
    '/entities/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.searchEntitiesOfTemplate,
);

SimbaRouter.post(
    '/entities/expanded/:entityId',
    ValidateRequest(getExpandedEntityByIdRequestSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getExpandedEntityById,
);

SimbaRouter.post(
    '/entities',
    busboyMiddleware,
    ValidateRequest(createSimbaEntitySchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.createEntity,
);

SimbaRouter.get(
    '/notifications/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getMyNotifications,
);

SimbaRouter.post(
    '/notifications/my/group-count',
    ValidateRequest(getMyNotificationGroupCountRequestSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getMyNotificationGroupCount,
);

SimbaRouter.post(
    '/notifications/seen',
    ValidateRequest(manyNotificationSeenRequestSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.manyNotificationSeen,
);

export default SimbaRouter;
