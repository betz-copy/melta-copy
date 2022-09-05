import { NotificationService, IBasicNotification, INotification } from '../../externalServices/notificationService';
import { ShragaUser } from '../../utils/express/passport';

export class NotificationsManager {
    static async getMyNotifications(user: ShragaUser, query: object): Promise<IBasicNotification[]> {
        const notifications = await NotificationService.getNotifications({ ...query, viewerId: user.id });
        return notifications.map(this.transformNotificationToClient);
    }

    static async getMyNotificationCount(user: ShragaUser, query: any): Promise<number> {
        return NotificationService.getNotificationCount({ ...query, viewerId: user.id });
    }

    static async notificationsSeen(notificationId: string, user: ShragaUser): Promise<IBasicNotification> {
        const notification = await NotificationService.notificationsSeen(notificationId, user.id);
        return this.transformNotificationToClient(notification);
    }

    static transformNotificationToClient = (notification: INotification): IBasicNotification => {
        const { viewers, ...basicNotification } = notification;
        return basicNotification;
    };
}

export default NotificationsManager;
