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

    static async notificationsSeen(req: Request, res: Response) {
        res.json(await NotificationsManager.notificationsSeen(req.params.notificationId, req.user as ShragaUser));
    }
}

export default NotificationsController;
