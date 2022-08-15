import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import NotificationsController from './controller';
import { getMyNotificationsRequestSchema, notificationSeenRequestSchema } from './validator.schema';

const notificationsRouter: Router = Router();

notificationsRouter.get('/my', ValidateRequest(getMyNotificationsRequestSchema), wrapController(NotificationsController.getMyNotifications));
notificationsRouter.patch(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapController(NotificationsController.notificationsSeen),
);

export default notificationsRouter;
