import { IRuleBreachAlertPopulated } from './ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from './ruleBreaches/ruleBreachRequest';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
}

interface IAlertMetadata {
    alertId: string;
}
export interface IAlertMetadataPopulated {
    alert: IRuleBreachAlertPopulated;
}

interface IRequestMetadata {
    requestId: string;
}
export interface IRequestMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}

interface IResponseMetadata {
    requestId: string;
}
export interface IResponseMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}

type INotificationMetadata = IAlertMetadata | IRequestMetadata | IResponseMetadata;
export type INotificationMetadataPopulated = IAlertMetadataPopulated | IRequestMetadataPopulated | IResponseMetadataPopulated;

export interface INotification {
    type: NotificationType;
    metadata: INotificationMetadata;
    createdAt: Date;
    _id: string;
}

export interface INotificationPopulated<T = INotificationMetadataPopulated> {
    type: NotificationType;
    metadata: T;
    createdAt: Date;
    _id: string;
}

export const isAlertNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IAlertMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachAlert;
};

export const isRequestNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRequestMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachRequest;
};

export const isResponseNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IResponseMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachResponse;
};
