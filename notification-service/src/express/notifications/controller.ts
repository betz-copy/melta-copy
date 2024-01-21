import { Request, Response } from 'express';
import { NotificationsManager } from './manager';

class NotificationsController {
    static async getNotifications(req: Request, res: Response) {
        const { limit, step, ...query } = req.query as any;
        console.log('rest of query', { query });

        res.json(await NotificationsManager.getNotifications(limit, step, query));
    }

    public static async getNotificationCount(req: Request, res: Response) {
        res.json(await NotificationsManager.getNotificationCount(req.query));
    }

    public static async getNotificationGroupCount(req: Request, res: Response) {
        const { groups, ...query } = req.body;

        res.json(await NotificationsManager.getNotificationGroupCount(groups, query));
    }

    static async getNotificationById(req: Request, res: Response) {
        const { notificationId } = req.params;
        res.json(await NotificationsManager.getNotificationById(notificationId));
    }

    static async createNotification(req: Request, res: Response) {
        res.json(await NotificationsManager.createNotification(req.body));
    }

    static async notificationSeen(req: Request, res: Response) {
        const { notificationId } = req.params;
        const { viewerId } = req.body;

        res.json(await NotificationsManager.notificationSeen(notificationId, viewerId));
    }

    static async manyNotificationSeen(req: Request, res: Response) {
        const { viewerId, ...query } = req.body;

        res.json(await NotificationsManager.manyNotificationSeen(viewerId, query));
    }
}

export default NotificationsController;
