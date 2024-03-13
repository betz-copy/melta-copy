import {
    IDateAboutToExpireNotificationMetadata,
    INewProcessNotificationMetadata,
    INotification,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachResponseNotificationMetadata,
    isDateAboutToExpireNotification,
    isNewProcessNotification,
    isProcessReviewerUpdateNotification,
    isProcessStatusUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
    isDeleteProcessNotification,
    IDeleteProcessNotificationMetadata,
    IArchiveProcessNotificationMetadata,
    isArchiveProcessNotification,
} from '../../externalServices/notificationService/interfaces';
import {
    IArchiveProcessNotificationMetadataPopulated,
    IDateAboutToExpireMetadataPopulated,
    IDeleteProcessNotificationMetadataPopulated,
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
import RuleBreachesManager from '../ruleBreaches/manager';
import ProcessesInstancesManager from '../processes/processInstances/manager';
import { InstanceManagerService } from '../../externalServices/instanceService';

export class NotificationsManager {
    static async getMyNotifications(user: Express.User, query): Promise<INotificationPopulated[]> {
        console.log({ query });
        // const startDateFilter = query.startDate && new Date(new Date(query.startDate)).setDate(new Date(query.startDate).getDate() + 1);
        // console.log('1: ', { startDateFilter });

        const notifications = await NotificationService.getNotifications({
            ...query,
            viewerId: user.id,
            // startDate: startDateFilter,
            // endDate: query.endDate && new Date().setDate(query.endDate.getDate() + 1),
        });

        return this.populateNotifications(notifications, user.id);
    }

    static async getMyNotificationCount(user: Express.User, query: any): Promise<number> {
        return NotificationService.getNotificationCount({ ...query, viewerId: user.id });
    }

    static async getMyNotificationGroupCount(user: Express.User, query: any) {
        return NotificationService.getNotificationGroupCount({ ...query, viewerId: user.id });
    }

    static async notificationsSeen(notificationId: string, user: Express.User): Promise<INotificationPopulated> {
        const notification = await NotificationService.notificationSeen(notificationId, user.id);
        return this.populateNotification(notification, user.id);
    }

    static async manyNotificationsSeen(user: Express.User, query: any): Promise<INotificationPopulated[]> {
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

        const process = await ProcessesInstancesManager.getProcessInstanceOrNull(processId, userId);

        const populatedMetadata: IProcessStatusUpdateNotificationMetadataPopulated = { process, status };

        if (stepId) {
            populatedMetadata.step = process ? process.steps.find((currStep) => currStep._id === stepId) : null;
        }

        return populatedMetadata;
    }

    private static async populateNewProcessNotificationMetadata(
        metadata: INewProcessNotificationMetadata,
        userId: string,
    ): Promise<INewProcessNotificationMetadataPopulated | null> {
        const process = await ProcessesInstancesManager.getProcessInstanceOrNull(metadata.processId, userId);
        return { process };
    }

    private static async populateDeleteProcessNotificationMetadata(
        metadata: IDeleteProcessNotificationMetadata,
    ): Promise<IDeleteProcessNotificationMetadataPopulated> {
        return { ...metadata };
    }

    private static async populateArchiveProcessNotificationMetadata(
        metadata: IArchiveProcessNotificationMetadata,
        userId: string,
    ): Promise<IArchiveProcessNotificationMetadataPopulated | null> {
        const { isArchived } = metadata;
        const process = await ProcessesInstancesManager.getProcessInstanceOrNull(metadata.processId, userId);
        return { process, isArchived };
    }

    private static async populateProcessReviewerUpdateNotificationMetadata(
        metadata: IProcessReviewerUpdateNotificationMetadata,
        userId: string,
    ): Promise<IProcessReviewerUpdateNotificationMetadataPopulated | null> {
        const { processId, addedStepIds, deletedStepIds, unchangedStepIds } = metadata;
        const process = await ProcessesInstancesManager.getProcessInstanceOrNull(processId, userId);

        if (!process) {
            return {
                process,
                addedSteps: addedStepIds.map(() => null),
                deletedSteps: deletedStepIds.map(() => null),
                unchangedSteps: unchangedStepIds.map(() => null),
            };
        }

        const steps: Omit<IProcessReviewerUpdateNotificationMetadataPopulated, 'process'> = {
            addedSteps: [],
            deletedSteps: [],
            unchangedSteps: [],
        };
        if (process) {
            process.steps.forEach((step) => {
                if (addedStepIds.includes(step._id)) {
                    steps.addedSteps.push(step);
                } else if (deletedStepIds.includes(step._id)) {
                    steps.deletedSteps.push(step);
                } else if (unchangedStepIds.includes(step._id)) {
                    steps.unchangedSteps.push(step);
                }
            });
        }

        return {
            process,
            ...steps,
        };
    }

    private static async populateDateAboutToExpireNotificationMetadata(
        metadata: IDateAboutToExpireNotificationMetadata,
    ): Promise<IDateAboutToExpireMetadataPopulated> {
        const { entityId, propertyName, datePropertyValue } = metadata;
        const entity = await InstanceManagerService.getEntityInstanceById(entityId).catch(() => null);
        return {
            entity,
            propertyName,
            datePropertyValue,
        };
    }

    static async populateNotification(notification: INotification, userId: string): Promise<INotificationPopulated> {
        const { viewers, ...restOfNotification } = notification;

        let populatedMetadata: INotificationMetadataPopulated | null;

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
        } else if (isDateAboutToExpireNotification(notification)) {
            populatedMetadata = await this.populateDateAboutToExpireNotificationMetadata(notification.metadata);
        } else if (isDeleteProcessNotification(notification)) {
            populatedMetadata = await this.populateDeleteProcessNotificationMetadata(notification.metadata);
        } else if (isArchiveProcessNotification(notification)) {
            populatedMetadata = await this.populateArchiveProcessNotificationMetadata(notification.metadata, userId);
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
