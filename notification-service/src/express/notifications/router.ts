import { Router } from 'express';
import NotificationsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createNotificationRequestSchema,
    getNotificationByIdRequestSchema,
    getNotificationCountRequestSchema,
    getNotificationGroupCountRequestSchema,
    getNotificationsRequestSchema,
    manyNotificationSeenRequestSchema,
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

notificationsRouter.post(
    '/group-count',
    ValidateRequest(getNotificationGroupCountRequestSchema),
    wrapController(NotificationsController.getNotificationGroupCount),
);

notificationsRouter.post('/', ValidateRequest(createNotificationRequestSchema), wrapController(NotificationsController.createNotification));

notificationsRouter.post(
    '/:notificationId/seen',
    ValidateRequest(notificationSeenRequestSchema),
    wrapController(NotificationsController.notificationSeen),
);
notificationsRouter.post('/seen', ValidateRequest(manyNotificationSeenRequestSchema), wrapController(NotificationsController.manyNotificationSeen));

export default notificationsRouter;
