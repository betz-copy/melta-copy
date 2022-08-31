import { Request, Response } from 'express';
import { NotificationsManager } from './manager';

class NotificationsController {
    static async getNotifications(req: Request, res: Response) {
        const { limit, step, type, viewerId } = req.query as any;
        res.json(await NotificationsManager.getNotifications(limit, step, type, viewerId));
    }

    public static async getNotificationCount(req: Request, res: Response) {
        const { type, viewerId } = req.query as any;
        res.json(await NotificationsManager.getNotificationCount(type, viewerId));
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
}

export default NotificationsController;
