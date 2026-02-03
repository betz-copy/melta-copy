import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import NotificationsManager from './manager';

class NotificationsController extends DefaultController<NotificationsManager> {
    constructor(workspaceId: string) {
        super(new NotificationsManager(workspaceId));
    }

    async getMyNotifications(req: Request, res: Response) {
        res.json(await this.manager.getMyNotifications(req.user!, req.query));
    }

    async getMyNotificationCount(req: Request, res: Response) {
        res.json(await this.manager.getMyNotificationCount(req.user!, req.query));
    }

    async getMyNotificationGroupCount(req: Request, res: Response) {
        res.json(await this.manager.getMyNotificationGroupCount(req.user!, req.body));
    }

    async notificationsSeen(req: Request, res: Response) {
        res.json(await this.manager.notificationsSeen(req.params.notificationId as string, req.user!));
    }

    async manyNotificationsSeen(req: Request, res: Response) {
        res.json(await this.manager.manyNotificationsSeen(req.user!, req.body));
    }
}

export default NotificationsController;
