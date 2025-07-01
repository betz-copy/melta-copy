import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import ClientSideController from './controller';
import {
    getInstancesByTemplateIdSchema,
    countEntitiesOfTemplatesByUserEntityIdSchema,
    getAllClientSideTemplatesSchema,
    searchEntitiesOfTemplateSchema,
    getExpandedEntityByIdRequestSchema,
    createClientSideEntitySchema,
} from './validator.schema';
import ClientSideValidator from './middlewares';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';
import {
    getMyNotificationGroupCountRequestSchema,
    getMyNotificationsRequestSchema,
    manyNotificationSeenRequestSchema,
} from '../notifications/validator.schema';

const ClientSideRouter: Router = Router();

const ClientSideControllerMiddleware = createController(ClientSideController);
const ClientSideValidatorMiddleware = createController(ClientSideValidator, true);

ClientSideRouter.post(
    '/templates/all',
    ValidateRequest(getAllClientSideTemplatesSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.getAllClientSideTemplates,
);

ClientSideRouter.post(
    '/entities/:templateId',
    ValidateRequest(getInstancesByTemplateIdSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.getInstancesByTemplateId,
);

ClientSideRouter.post(
    '/entities/count/user-entity-id',
    ValidateRequest(countEntitiesOfTemplatesByUserEntityIdSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.countEntitiesOfTemplatesByUserEntityId,
);

ClientSideRouter.post(
    '/entities/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.searchEntitiesOfTemplate,
);

ClientSideRouter.post(
    '/entities/expanded/:entityId',
    ValidateRequest(getExpandedEntityByIdRequestSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.getExpandedEntityById,
);

ClientSideRouter.post(
    '/entities',
    busboyMiddleware,
    ValidateRequest(createClientSideEntitySchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.createEntity,
);

ClientSideRouter.get(
    '/notifications/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.getMyNotifications,
);

ClientSideRouter.post(
    '/notifications/my/group-count',
    ValidateRequest(getMyNotificationGroupCountRequestSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.getMyNotificationGroupCount,
);

ClientSideRouter.post(
    '/notifications/seen',
    ValidateRequest(manyNotificationSeenRequestSchema),
    ClientSideValidatorMiddleware.validateUserCanAccessClientSide,
    ClientSideControllerMiddleware.manyNotificationSeen,
);

export default ClientSideRouter;
