import {
    INotification,
    isNewProcessNotification,
    isProcessApproverUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
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

    static async getMyNotificationGroupCount(user: ShragaUser, query: any) {
        return NotificationService.getNotificationGroupCount({ ...query, viewerId: user.id });
    }

    static async notificationsSeen(notificationId: string, user: ShragaUser): Promise<INotificationPopulated> {
        const notification = await NotificationService.notificationSeen(notificationId, user.id);
        return NotificationsManager.populateNotification(notification);
    }

    static async manyNotificationsSeen(user: ShragaUser, query: any): Promise<INotificationPopulated[]> {
        const notifications = await NotificationService.manyNotificationsSeen({ ...query, viewerId: user.id });
        return Promise.all(notifications.map(NotificationsManager.populateNotification));
    }

    static async populateNotification(notification: INotification): Promise<INotificationPopulated> {
        const { viewers, ...restOfNotification } = notification;

        let populatedMetadata: INotificationMetadataPopulated;

        if (isRuleBreachAlertNotification(notification))
            populatedMetadata = { alert: await RuleBreachesManager.getRuleBreachAlertsById(notification.metadata.alertId) };
        else if (isRuleBreachRequestNotification(notification) || isRuleBreachResponseNotification(notification)) {
            populatedMetadata = { request: await RuleBreachesManager.getRuleBreachRequestById(notification.metadata.requestId) };
        } else if (isNewProcessNotification(notification) || isProcessApproverUpdateNotification(notification)) {
            // TODO: add real population
            populatedMetadata = notification.metadata as any;
        }

        return {
            ...restOfNotification,
            metadata: populatedMetadata!,
        };
    }
}

export default NotificationsManager;
