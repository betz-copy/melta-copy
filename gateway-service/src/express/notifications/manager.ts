import {
    INewProcessNotificationMetadata,
    INotification,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachResponseNotificationMetadata,
    isNewProcessNotification,
    isProcessReviewerUpdateNotification,
    isProcessStatusUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
} from '../../externalServices/notificationService/interfaces';
import {
    INewProcessNotificationMetadataPopulated,
    INotificationMetadataPopulated,
    INotificationPopulated,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import { NotificationService } from '../../externalServices/notificationService';
import { ShragaUser } from '../../utils/express/passport';
import RuleBreachesManager from '../ruleBreaches/manager';
import ProcessesInstancesManager from '../processes/processInstances/manager';

export class NotificationsManager {
    static async getMyNotifications(user: ShragaUser, query: object): Promise<INotificationPopulated[]> {
        const notifications = await NotificationService.getNotifications({ ...query, viewerId: user.id });
        return this.populateNotifications(notifications, user.id);
    }

    static async getMyNotificationCount(user: ShragaUser, query: any): Promise<number> {
        return NotificationService.getNotificationCount({ ...query, viewerId: user.id });
    }

    static async getMyNotificationGroupCount(user: ShragaUser, query: any) {
        return NotificationService.getNotificationGroupCount({ ...query, viewerId: user.id });
    }

    static async notificationsSeen(notificationId: string, user: ShragaUser): Promise<INotificationPopulated> {
        const notification = await NotificationService.notificationSeen(notificationId, user.id);
        return this.populateNotification(notification, user.id);
    }

    static async manyNotificationsSeen(user: ShragaUser, query: any): Promise<INotificationPopulated[]> {
        const notifications = await NotificationService.manyNotificationsSeen({ ...query, viewerId: user.id });
        return this.populateNotifications(notifications, user.id);
    }

    private static async populateRuleBreachAlertNotificationMetadata(
        metadata: IRuleBreachAlertNotificationMetadata,
    ): Promise<IRuleBreachAlertNotificationMetadataPopulated> {
        return { alert: await RuleBreachesManager.getRuleBreachAlertsById(metadata.alertId) };
    }

    private static async populateRuleBreachRequestOrResponseNotificationMetadata(
        metadata: IRuleBreachRequestNotificationMetadata | IRuleBreachResponseNotificationMetadata,
    ): Promise<IRuleBreachRequestNotificationMetadataPopulated | IRuleBreachResponseNotificationMetadataPopulated> {
        return { request: await RuleBreachesManager.getRuleBreachRequestById(metadata.requestId) };
    }

    private static async populateStatusUpdateNotificationMetadata(
        metadata: IProcessStatusUpdateNotificationMetadata,
        userId: string,
    ): Promise<IProcessStatusUpdateNotificationMetadataPopulated> {
        const { processId, status, stepId } = metadata;
        const process = await ProcessesInstancesManager.getProcessInstance(processId, userId);

        const populatedMetadata: IProcessStatusUpdateNotificationMetadataPopulated = { process, status };

        if (stepId) {
            populatedMetadata.step = process.steps.find((currStep) => currStep._id === stepId);
        }

        return populatedMetadata;
    }

    private static async populateNewProcessNotificationMetadata(
        metadata: INewProcessNotificationMetadata,
        userId: string,
    ): Promise<INewProcessNotificationMetadataPopulated> {
        return { process: await ProcessesInstancesManager.getProcessInstance(metadata.processId, userId) };
    }

    private static async populateProcessReviewerUpdateNotificationMetadata(
        metadata: IProcessReviewerUpdateNotificationMetadata,
        userId: string,
    ): Promise<IProcessReviewerUpdateNotificationMetadataPopulated> {
        const { processId, addedStepIds, deletedStepIds, unchangedStepIds } = metadata;
        const process = await ProcessesInstancesManager.getProcessInstance(processId, userId);

        const steps: Omit<IProcessReviewerUpdateNotificationMetadataPopulated, 'process'> = {
            addedSteps: [],
            deletedSteps: [],
            unchangedSteps: [],
        };

        process.steps.forEach((step) => {
            if (addedStepIds.includes(step._id)) {
                steps.addedSteps.push(step);
            } else if (deletedStepIds.includes(step._id)) {
                steps.deletedSteps.push(step);
            } else if (unchangedStepIds.includes(step._id)) {
                steps.unchangedSteps.push(step);
            }
        });

        return {
            process,
            ...steps,
        };
    }

    static async populateNotification(notification: INotification, userId: string): Promise<INotificationPopulated> {
        const { viewers, ...restOfNotification } = notification;

        let populatedMetadata: INotificationMetadataPopulated;

        if (isRuleBreachAlertNotification(notification)) {
            populatedMetadata = await this.populateRuleBreachAlertNotificationMetadata(notification.metadata);
        } else if (isRuleBreachRequestNotification(notification) || isRuleBreachResponseNotification(notification)) {
            populatedMetadata = await this.populateRuleBreachRequestOrResponseNotificationMetadata(notification.metadata);
        } else if (isProcessStatusUpdateNotification(notification)) {
            populatedMetadata = await this.populateStatusUpdateNotificationMetadata(notification.metadata, userId);
        } else if (isNewProcessNotification(notification)) {
            populatedMetadata = await this.populateNewProcessNotificationMetadata(notification.metadata, userId);
        } else if (isProcessReviewerUpdateNotification(notification)) {
            populatedMetadata = await this.populateProcessReviewerUpdateNotificationMetadata(notification.metadata, userId);
        }

        return {
            ...restOfNotification,
            metadata: populatedMetadata!,
        };
    }

    static async populateNotifications(notifications: INotification[], userId: string): Promise<INotificationPopulated[]> {
        return Promise.all(notifications.map((notification) => this.populateNotification(notification, userId)));
    }
}

export default NotificationsManager;
