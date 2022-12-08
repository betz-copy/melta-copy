import {
    INotification,
    isAlertNotification,
    isRequestNotification,
    isResponseNotification,
} from '../../externalServices/notificationService/interfaces';
import { INotificationMetadataPopulated, INotificationPopulated } from '../../externalServices/notificationService/interfaces/populated';
import { NotificationService } from '../../externalServices/notificationService';
import { ShragaUser } from '../../utils/express/passport';
import RuleBreachesManager from '../ruleBreaches/manager';

export class NotificationsManager {
    static async getMyNotifications(user: ShragaUser, query: object): Promise<INotificationPopulated[]> {
        const notifications = await NotificationService.getNotifications({ ...query, viewerId: user.id });
        return Promise.all(notifications.map(NotificationsManager.populateNotification));
    }

    static async getMyNotificationCount(user: ShragaUser, query: any): Promise<number> {
        return NotificationService.getNotificationCount({ ...query, viewerId: user.id });
    }

    static async notificationsSeen(notificationId: string, user: ShragaUser): Promise<INotificationPopulated> {
        const notification = await NotificationService.notificationsSeen(notificationId, user.id);
        return NotificationsManager.populateNotification(notification);
    }

    static async populateNotification(notification: INotification): Promise<INotificationPopulated> {
        const { viewers, ...restOfNotification } = notification;

        let populatedMetadata: INotificationMetadataPopulated;

        if (isAlertNotification(notification))
            populatedMetadata = { alert: await RuleBreachesManager.getRuleBreachAlertsById(notification.metadata.alertId) };
        else if (isRequestNotification(notification) || isResponseNotification(notification)) {
            populatedMetadata = { request: await RuleBreachesManager.getRuleBreachRequestById(notification.metadata.requestId) };
        }

        return {
            ...restOfNotification,
            metadata: populatedMetadata!,
        };
    }
}

export default NotificationsManager;
