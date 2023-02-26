import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../utils/express';
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

notificationsRouter.get(
    '/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.getMyNotifications),
);

notificationsRouter.get(
    '/my/count',
    ValidateRequest(getMyNotificationCountRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.getMyNotificationCount),
);
notificationsRouter.post(
    '/my/group-count',
    ValidateRequest(getMyNotificationGroupCountRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.getMyNotificationGroupCount),
);

notificationsRouter.post(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.notificationsSeen),
);

notificationsRouter.post(
    '/seen',
    ValidateRequest(manyNotificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.manyNotificationsSeen),
);

export default notificationsRouter;
