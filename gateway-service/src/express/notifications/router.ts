import { Router } from 'express';
import { createWorkspacesController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
import NotificationsController from './controller';
import {
    getMyNotificationCountRequestSchema,
    getMyNotificationGroupCountRequestSchema,
    getMyNotificationsRequestSchema,
    manyNotificationSeenRequestSchema,
    notificationSeenRequestSchema,
} from './validator.schema';

const notificationsRouter: Router = Router();

const NotificationsControllerMiddleware = createWorkspacesController(NotificationsController);

notificationsRouter.get(
    '/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    NotificationsControllerMiddleware('getMyNotifications'),
);

notificationsRouter.get(
    '/my/count',
    ValidateRequest(getMyNotificationCountRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    NotificationsControllerMiddleware('getMyNotificationCount'),
);
notificationsRouter.post(
    '/my/group-count',
    ValidateRequest(getMyNotificationGroupCountRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    NotificationsControllerMiddleware('getMyNotificationGroupCount'),
);

notificationsRouter.post(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    NotificationsControllerMiddleware('notificationsSeen'),
);

notificationsRouter.post(
    '/seen',
    ValidateRequest(manyNotificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    NotificationsControllerMiddleware('manyNotificationsSeen'),
);

export default notificationsRouter;
