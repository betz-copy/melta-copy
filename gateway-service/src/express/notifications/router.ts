import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
import NotificationsController from './controller';
import { getMyNotificationsRequestSchema, notificationSeenRequestSchema } from './validator.schema';

const notificationsRouter: Router = Router();

notificationsRouter.get(
    '/my',
    ValidateRequest(getMyNotificationsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.getMyNotifications),
);
notificationsRouter.patch(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(NotificationsController.notificationsSeen),
);

export default notificationsRouter;
