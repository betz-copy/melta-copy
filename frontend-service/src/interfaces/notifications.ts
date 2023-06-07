import { IMongoProcessInstancePopulated } from './processes/processInstance';
import { Status } from './processes/processInstance';
import { IMongoStepInstancePopulated } from './processes/stepInstance';
import { IRuleBreachAlertPopulated } from './ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from './ruleBreaches/ruleBreachRequest';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',

    processReviewerUpdate = 'processReviewerUpdate',
    processStatusUpdate = 'processStatusUpdate',
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

export interface IProcessReviewerUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated;
    addedSteps: IMongoStepInstancePopulated[];
    deletedSteps: IMongoStepInstancePopulated[];
    unchangedSteps: IMongoStepInstancePopulated[];
}
export interface IProcessStatusUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated;
    step?: IMongoStepInstancePopulated;
    status: Status;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated;
}

export type INotificationMetadataPopulated =
    | IRuleBreachAlertNotificationMetadataPopulated
    | IRuleBreachRequestNotificationMetadataPopulated
    | IRuleBreachResponseNotificationMetadataPopulated
    | IProcessReviewerUpdateNotificationMetadataPopulated
    | IProcessStatusUpdateNotificationMetadataPopulated
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

export const isProcessReviewerUpdateNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IProcessReviewerUpdateNotificationMetadataPopulated> =>
    notification.type === NotificationType.processReviewerUpdate;
export const isProcessStatusUpdateNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IProcessStatusUpdateNotificationMetadataPopulated> =>
    notification.type === NotificationType.processStatusUpdate;
export const isNewProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<INewProcessNotificationMetadataPopulated> => notification.type === NotificationType.newProcess;

export type INotificationCountGroups = Record<string, NotificationType[]>;
export interface INotificationGroupCountDetails {
    groups: Record<string, number>;
    total: number;
}
