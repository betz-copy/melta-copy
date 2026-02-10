import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import NotificationsController from './controller';
import {
    getMyNotificationCountRequestSchema,
    getMyNotificationGroupCountRequestSchema,
    getMyNotificationsRequestSchema,
    manyNotificationSeenRequestSchema,
    notificationSeenRequestSchema,
} from './validator.schema';

const notificationsRouter: Router = Router();

const NotificationsControllerMiddleware = createController(NotificationsController);

notificationsRouter.get(
    '/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    NotificationsControllerMiddleware.getMyNotifications,
);

notificationsRouter.get(
    '/my/count',
    ValidateRequest(getMyNotificationCountRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    NotificationsControllerMiddleware.getMyNotificationCount,
);
notificationsRouter.post(
    '/my/group-count',
    ValidateRequest(getMyNotificationGroupCountRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    NotificationsControllerMiddleware.getMyNotificationGroupCount,
);

notificationsRouter.post(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    NotificationsControllerMiddleware.notificationsSeen,
);

notificationsRouter.post(
    '/seen',
    ValidateRequest(manyNotificationSeenRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    NotificationsControllerMiddleware.manyNotificationsSeen,
);

export default notificationsRouter;
