import { IRuleBreachAlertPopulated } from './ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from './ruleBreaches/ruleBreachRequest';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
    processApproverUpdate = 'processApproverUpdate',
    newProcess = 'newProcess',
}

export interface IRuleBreachAlertNotificationMetadataPopulated {
    alert: IRuleBreachAlertPopulated;
}
export interface IRuleBreachRequestNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}
export interface IRuleBreachResponseNotificationMetadataPopulated {
    request: IRuleBreachRequestPopulated;
}

export interface IProcessApproverUpdateNotificationMetadataPopulated {
    process: object; // TODO: add process interface
    approverStepNames: string[];
    previousApproverStepNames: string[];
}
export interface INewProcessNotificationMetadataPopulated {
    process: object; // TODO: add process interface
}

export type INotificationMetadataPopulated =
    | IRuleBreachAlertNotificationMetadataPopulated
    | IRuleBreachRequestNotificationMetadataPopulated
    | IRuleBreachResponseNotificationMetadataPopulated
    | IProcessApproverUpdateNotificationMetadataPopulated
    | INewProcessNotificationMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> {
    type: NotificationType;
    metadata: T;
    createdAt: Date;
    _id: string;
}

export const isRuleBreachAlertNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachAlertNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachAlert;
};

export const isRuleBreachRequestNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachRequestNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachRequest;
};

export const isRuleBreachResponseNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachResponseNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachResponse;
};

export const isProcessApproverUpdateNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IProcessApproverUpdateNotificationMetadataPopulated> =>
    notification.type === NotificationType.processApproverUpdate;

export const isNewProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<INewProcessNotificationMetadataPopulated> => notification.type === NotificationType.newProcess;

export type INotificationCountGroups = Record<string, NotificationType[]>;
export interface INotificationGroupCountDetails {
    groups: Record<string, number>;
    total: number;
}
