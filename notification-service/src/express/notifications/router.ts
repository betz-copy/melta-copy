import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import NotificationsController from './controller';
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

const controller = createController(NotificationsController);

notificationsRouter.get('/', ValidateRequest(getNotificationsRequestSchema), controller.getNotifications);
notificationsRouter.get('/count', ValidateRequest(getNotificationCountRequestSchema), controller.getNotificationCount);
notificationsRouter.get('/:notificationId', ValidateRequest(getNotificationByIdRequestSchema), controller.getNotificationById);
notificationsRouter.post('/group-count', ValidateRequest(getNotificationGroupCountRequestSchema), controller.getNotificationGroupCount);
notificationsRouter.post('/', ValidateRequest(createNotificationRequestSchema), controller.createNotification);
notificationsRouter.post('/:notificationId/seen', ValidateRequest(notificationSeenRequestSchema), controller.notificationSeen);
notificationsRouter.post('/seen', ValidateRequest(manyNotificationSeenRequestSchema), controller.manyNotificationSeen);

export default notificationsRouter;
