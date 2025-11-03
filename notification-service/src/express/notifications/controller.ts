import { DefaultController, INotification } from '@microservices/shared';
import { Request, Response } from 'express';
import { NotificationsManager } from './manager';

class NotificationsController extends DefaultController<INotification, NotificationsManager> {
    constructor(workspaceId: string) {
        super(new NotificationsManager(workspaceId));
    }

    async getNotifications(req: Request, res: Response) {
        const { limit, step, ...query } = req.query as any;

        res.json(await this.manager.getNotifications(limit, step, query));
    }

    async getNotificationCount(req: Request, res: Response) {
        res.json(await this.manager.getNotificationCount(req.query));
    }

    async getNotificationGroupCount(req: Request, res: Response) {
        const { groups, ...query } = req.body;

        res.json(await this.manager.getNotificationGroupCount(groups, query));
    }

    async getNotificationById(req: Request, res: Response) {
        const { notificationId } = req.params;
        res.json(await this.manager.getNotificationById(notificationId));
    }

    async createNotification(req: Request, res: Response) {
        res.json(await this.manager.createNotification(req.body));
    }

    async notificationSeen(req: Request, res: Response) {
        const { notificationId } = req.params;
        const { viewerId } = req.body;

        res.json(await this.manager.notificationSeen(notificationId, viewerId));
    }

    async manyNotificationSeen(req: Request, res: Response) {
        const { viewerId, ...query } = req.body;

        res.json(await this.manager.manyNotificationSeen(viewerId, query));
    }
}

export default NotificationsController;
