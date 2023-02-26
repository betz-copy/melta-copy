export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
    processApproverUpdate = 'processApproverUpdate',
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

export interface IProcessApproverUpdateNotificationMetadata {
    processId: string;
    approverStepIds: string[];
}
export interface INewProcessNotificationMetadata {
    processId: string;
}

type INotificationMetadata =
    | IRuleBreachAlertNotificationMetadata
    | IRuleBreachRequestNotificationMetadata
    | IRuleBreachResponseNotificationMetadata
    | IProcessApproverUpdateNotificationMetadata
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
export const isProcessApproverUpdateNotification = (
    notification: Partial<INotification>,
): notification is INotification<IProcessApproverUpdateNotificationMetadata> => notification.type === NotificationType.processApproverUpdate;
export const isNewProcessNotification = (notification: Partial<INotification>): notification is INotification<INewProcessNotificationMetadata> =>
    notification.type === NotificationType.newProcess;
