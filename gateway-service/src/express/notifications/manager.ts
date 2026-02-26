import {
    IArchiveProcessNotificationMetadata,
    IArchiveProcessNotificationMetadataPopulated,
    IDateAboutToExpireMetadataPopulated,
    IDateAboutToExpireNotificationMetadata,
    IDeleteProcessNotificationMetadata,
    IDeleteProcessNotificationMetadataPopulated,
    INewProcessNotificationMetadata,
    INewProcessNotificationMetadataPopulated,
    INotification,
    INotificationMetadataPopulated,
    INotificationPopulated,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadata,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '@packages/notification';
import { IReqUser } from '@packages/user';
import InstancesService from '../../externalServices/instanceService';
import NotificationService from '../../externalServices/notificationService';
import {
    isArchiveProcessNotification,
    isDateAboutToExpireNotification,
    isDeleteProcessNotification,
    isNewProcessNotification,
    isProcessReviewerUpdateNotification,
    isProcessStatusUpdateNotification,
    isRuleBreachAlertNotification,
    isRuleBreachRequestNotification,
    isRuleBreachResponseNotification,
} from '../../externalServices/notificationService/interfaces';
import DefaultManagerProxy from '../../utils/express/manager';
import ProcessesInstancesManager from '../processes/processInstances/manager';
import RuleBreachesManager from '../ruleBreaches/manager';

class NotificationsManager extends DefaultManagerProxy<NotificationService> {
    private instancesService: InstancesService;

    private ruleBreachesManager: RuleBreachesManager;

    private processesInstancesManager: ProcessesInstancesManager;

    constructor(workspaceId: string) {
        super(new NotificationService(workspaceId));
        this.instancesService = new InstancesService(workspaceId);
        this.ruleBreachesManager = new RuleBreachesManager(workspaceId);
        this.processesInstancesManager = new ProcessesInstancesManager(workspaceId);
    }

    async getMyNotifications(user: IReqUser, query): Promise<INotificationPopulated[]> {
        const startDate = query.startDate && new Date(query.startDate);
        const endDate = query.endDate && new Date(query.endDate);

        const notifications = await this.service.getNotifications({
            ...query,
            viewerId: user._id,
            startDate,
            endDate,
        });

        return this.populateNotifications(notifications, user);
    }

    // biome-ignore lint/suspicious/noExplicitAny: query axios any
    async getMyNotificationCount(user: IReqUser, query: Record<string, any>): Promise<number> {
        return this.service.getNotificationCount({ ...query, viewerId: user._id });
    }

    // biome-ignore lint/suspicious/noExplicitAny: query axios any
    async getMyNotificationGroupCount(user: IReqUser, query: Record<string, any>) {
        return this.service.getNotificationGroupCount({ ...query, viewerId: user._id });
    }

    async notificationsSeen(notificationId: string, user: IReqUser): Promise<INotificationPopulated> {
        const notification = await this.service.notificationSeen(notificationId, user._id);
        return this.populateNotification(notification, user);
    }

    // biome-ignore lint/suspicious/noExplicitAny: query axios any
    async manyNotificationsSeen(user: IReqUser, query: Record<string, any>): Promise<INotificationPopulated[]> {
        const notifications = await this.service.manyNotificationsSeen({ ...query, viewerId: user._id });
        return this.populateNotifications(notifications, user);
    }

    private async populateRuleBreachAlertNotificationMetadata(
        metadata: IRuleBreachAlertNotificationMetadata,
    ): Promise<IRuleBreachAlertNotificationMetadataPopulated> {
        return { alert: await this.ruleBreachesManager.getRuleBreachAlertsById(metadata.alertId) };
    }

    private async populateRuleBreachRequestOrResponseNotificationMetadata(
        metadata: IRuleBreachRequestNotificationMetadata | IRuleBreachResponseNotificationMetadata,
    ): Promise<IRuleBreachRequestNotificationMetadataPopulated | IRuleBreachResponseNotificationMetadataPopulated> {
        return { request: await this.ruleBreachesManager.getRuleBreachRequestById(metadata.requestId) };
    }

    private async populateStatusUpdateNotificationMetadata(
        metadata: IProcessStatusUpdateNotificationMetadata,
        user: IReqUser,
    ): Promise<IProcessStatusUpdateNotificationMetadataPopulated> {
        const { processId, status, stepId } = metadata;

        const process = await this.processesInstancesManager.getProcessInstanceOrNull(processId, user);

        const populatedMetadata: IProcessStatusUpdateNotificationMetadataPopulated = { process, status };

        if (stepId) {
            populatedMetadata.step = process ? process.steps.find((currStep) => currStep._id === stepId) : null;
        }

        return populatedMetadata;
    }

    private async populateNewProcessNotificationMetadata(
        metadata: INewProcessNotificationMetadata,
        user: IReqUser,
    ): Promise<INewProcessNotificationMetadataPopulated | null> {
        const process = await this.processesInstancesManager.getProcessInstanceOrNull(metadata.processId, user);
        return { process };
    }

    private static async populateDeleteProcessNotificationMetadata(
        metadata: IDeleteProcessNotificationMetadata,
    ): Promise<IDeleteProcessNotificationMetadataPopulated> {
        return { ...metadata };
    }

    private async populateArchiveProcessNotificationMetadata(
        metadata: IArchiveProcessNotificationMetadata,
        user: IReqUser,
    ): Promise<IArchiveProcessNotificationMetadataPopulated | null> {
        const { isArchived } = metadata;
        const process = await this.processesInstancesManager.getProcessInstanceOrNull(metadata.processId, user);
        return { process, isArchived };
    }

    private async populateProcessReviewerUpdateNotificationMetadata(
        metadata: IProcessReviewerUpdateNotificationMetadata,
        user: IReqUser,
    ): Promise<IProcessReviewerUpdateNotificationMetadataPopulated | null> {
        const { processId, addedStepIds, deletedStepIds, unchangedStepIds } = metadata;
        const process = await this.processesInstancesManager.getProcessInstanceOrNull(processId, user);

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

    private async populateDateAboutToExpireNotificationMetadata(
        metadata: IDateAboutToExpireNotificationMetadata,
    ): Promise<IDateAboutToExpireMetadataPopulated> {
        const { entityId, propertyName, datePropertyValue } = metadata;
        const entity = await this.instancesService.getEntityInstanceById(entityId).catch(() => null);
        return {
            entity,
            propertyName,
            datePropertyValue,
        };
    }

    async populateNotification(notification: INotification, user: IReqUser): Promise<INotificationPopulated> {
        const { viewers: _viewers, ...restOfNotification } = notification;

        let populatedMetadata: INotificationMetadataPopulated | null;

        if (isRuleBreachAlertNotification(notification)) {
            populatedMetadata = await this.populateRuleBreachAlertNotificationMetadata(notification.metadata);
        } else if (isRuleBreachRequestNotification(notification) || isRuleBreachResponseNotification(notification)) {
            populatedMetadata = await this.populateRuleBreachRequestOrResponseNotificationMetadata(notification.metadata);
        } else if (isProcessStatusUpdateNotification(notification)) {
            populatedMetadata = await this.populateStatusUpdateNotificationMetadata(notification.metadata, user);
        } else if (isNewProcessNotification(notification)) {
            populatedMetadata = await this.populateNewProcessNotificationMetadata(notification.metadata, user);
        } else if (isProcessReviewerUpdateNotification(notification)) {
            populatedMetadata = await this.populateProcessReviewerUpdateNotificationMetadata(notification.metadata, user);
        } else if (isDateAboutToExpireNotification(notification)) {
            populatedMetadata = await this.populateDateAboutToExpireNotificationMetadata(notification.metadata);
        } else if (isDeleteProcessNotification(notification)) {
            populatedMetadata = await NotificationsManager.populateDeleteProcessNotificationMetadata(notification.metadata);
        } else if (isArchiveProcessNotification(notification)) {
            populatedMetadata = await this.populateArchiveProcessNotificationMetadata(notification.metadata, user);
        }
        return {
            ...restOfNotification,
            metadata: populatedMetadata!,
        };
    }

    async populateNotifications(notifications: INotification[], user: IReqUser): Promise<INotificationPopulated[]> {
        return Promise.all(notifications.map((notification) => this.populateNotification(notification, user)));
    }
}

export default NotificationsManager;
