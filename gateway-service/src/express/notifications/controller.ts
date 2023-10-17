import { Request, Response } from 'express';
import { NotificationsManager } from './manager';

class NotificationsController {
    static async getMyNotifications(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotifications(req.user!, req.query));
    }

    static async getMyNotificationCount(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotificationCount(req.user!, req.query));
    }

    static async getMyNotificationGroupCount(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotificationGroupCount(req.user!, req.body));
    }

    static async notificationsSeen(req: Request, res: Response) {
        res.json(await NotificationsManager.notificationsSeen(req.params.notificationId, req.user!));
    }

    static async manyNotificationsSeen(req: Request, res: Response) {
        res.json(await NotificationsManager.manyNotificationsSeen(req.user!, req.body));
    }
}

export default NotificationsController;
