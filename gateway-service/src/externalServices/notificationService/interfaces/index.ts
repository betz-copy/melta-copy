export interface IAlertNotificationMetadata {
    alertId: string;
}
export interface IRequestNotificationMetadata {
    requestId: string;
}
export interface IResponseNotificationMetadata {
    requestId: string;
}

export type INotificationMetadata = IAlertNotificationMetadata | IRequestNotificationMetadata | IResponseNotificationMetadata;

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
}

export interface INotification<T = INotificationMetadata> {
    viewers: string[];
    type: NotificationType;
    metadata: T;
    createdAt: Date;
}

export const isAlertNotification = (notification: Partial<INotification>): notification is INotification<IAlertNotificationMetadata> =>
    notification.type === NotificationType.ruleBreachAlert;
export const isRequestNotification = (notification: Partial<INotification>): notification is INotification<IRequestNotificationMetadata> =>
    notification.type === NotificationType.ruleBreachRequest;
export const isResponseNotification = (notification: Partial<INotification>): notification is INotification<IResponseNotificationMetadata> =>
    notification.type === NotificationType.ruleBreachResponse;
