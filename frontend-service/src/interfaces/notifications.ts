import { IRuleBreachAlertPopulated } from './ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from './ruleBreaches/ruleBreachRequest';

/* eslint-disable no-shadow */
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

export interface INotificationPopulated {
    type: NotificationType;
    metadata: INotificationMetadataPopulated;
    createdAt: Date;
    _id: string;
}
