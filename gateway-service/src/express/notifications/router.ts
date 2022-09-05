import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
import NotificationsController from './controller';
import { getMyNotificationCountRequestSchema, getMyNotificationsRequestSchema, notificationSeenRequestSchema } from './validator.schema';

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
notificationsRouter.patch(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.notificationsSeen),
);

export default notificationsRouter;
