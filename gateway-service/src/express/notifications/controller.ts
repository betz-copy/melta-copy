import { Request, Response } from 'express';
import { NotificationsManager } from './manager';
import { ShragaUser } from '../../utils/express/passport';

class NotificationsController {
    static async getMyNotifications(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotifications(req.user as ShragaUser, req.query));
    }

    static async getMyNotificationCount(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotificationCount(req.user as ShragaUser, req.query));
    }

    static async getMyNotificationGroupCount(req: Request, res: Response) {
        res.json(await NotificationsManager.getMyNotificationGroupCount(req.user as ShragaUser, req.body));
    }

    static async notificationsSeen(req: Request, res: Response) {
        res.json(await NotificationsManager.notificationsSeen(req.params.notificationId, req.user as ShragaUser));
    }

    static async manyNotificationsSeen(req: Request, res: Response) {
        res.json(await NotificationsManager.manyNotificationsSeen(req.user as ShragaUser, req.body));
    }
}

export default NotificationsController;
