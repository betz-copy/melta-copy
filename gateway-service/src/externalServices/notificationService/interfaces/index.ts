import { Status } from '../../processService/interfaces/processInstance';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',

    processReviewerUpdate = 'processReviewerUpdate',
    processStatusUpdate = 'processStatusUpdate',
    newProcess = 'newProcess',
}

export interface IRuleBreachAlertNotificationMetadata {
    alertId: string;
}
export interface IRuleBreachRequestNotificationMetadata {
    requestId: string;
}
export interface IRuleBreachResponseNotificationMetadata {
    requestId: string;
}

export interface IProcessReviewerUpdateNotificationMetadata {
    processId: string;
    addedStepIds: string[];
    deletedStepIds: string[];
    unchangedStepIds: string[];
}
export interface IProcessStatusUpdateNotificationMetadata {
    processId: string;
    stepId?: string;
    status: Status;
}
export interface INewProcessNotificationMetadata {
    processId: string;
}

type INotificationMetadata =
    | IRuleBreachAlertNotificationMetadata
    | IRuleBreachRequestNotificationMetadata
    | IRuleBreachResponseNotificationMetadata
    | IProcessReviewerUpdateNotificationMetadata
    | IProcessStatusUpdateNotificationMetadata
    | INewProcessNotificationMetadata;

export interface INotification<T = INotificationMetadata> {
    viewers: string[];
    type: NotificationType;
    metadata: T;
    createdAt: Date;
}

export const isRuleBreachAlertNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachAlertNotificationMetadata> => notification.type === NotificationType.ruleBreachAlert;
export const isRuleBreachRequestNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachRequestNotificationMetadata> => notification.type === NotificationType.ruleBreachRequest;
export const isRuleBreachResponseNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachResponseNotificationMetadata> => notification.type === NotificationType.ruleBreachResponse;
export const isProcessReviewerUpdateNotification = (
    notification: Partial<INotification>,
): notification is INotification<IProcessReviewerUpdateNotificationMetadata> => notification.type === NotificationType.processReviewerUpdate;
export const isProcessStatusUpdateNotification = (
    notification: Partial<INotification>,
): notification is INotification<IProcessStatusUpdateNotificationMetadata> => notification.type === NotificationType.processStatusUpdate;
export const isNewProcessNotification = (notification: Partial<INotification>): notification is INotification<INewProcessNotificationMetadata> =>
    notification.type === NotificationType.newProcess;
