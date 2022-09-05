import { Router } from 'express';
import NotificationsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createNotificationRequestSchema,
    getNotificationByIdRequestSchema,
    getNotificationCountRequestSchema,
    getNotificationsRequestSchema,
    notificationSeenRequestSchema,
} from './validator.schema';

const notificationsRouter: Router = Router();

notificationsRouter.get('/', ValidateRequest(getNotificationsRequestSchema), wrapController(NotificationsController.getNotifications));
notificationsRouter.get('/count', ValidateRequest(getNotificationCountRequestSchema), wrapController(NotificationsController.getNotificationCount));
notificationsRouter.get(
    '/:notificationId',
    ValidateRequest(getNotificationByIdRequestSchema),
    wrapController(NotificationsController.getNotificationById),
);

notificationsRouter.post('/', ValidateRequest(createNotificationRequestSchema), wrapController(NotificationsController.createNotification));
notificationsRouter.patch(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapController(NotificationsController.notificationSeen),
);

export default notificationsRouter;
