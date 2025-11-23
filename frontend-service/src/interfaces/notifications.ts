import { IEntity } from './entities';
import { IMongoProcessInstancePopulated, Status } from './processes/processInstance';
import { IMongoStepInstancePopulated } from './processes/stepInstance';
import { IRuleBreachAlertPopulated } from './ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from './ruleBreaches/ruleBreachRequest';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
    ruleIndicatorAlert = 'ruleIndicatorAlert',
    processReviewerUpdate = 'processReviewerUpdate',
    processStatusUpdate = 'processStatusUpdate',
    newProcess = 'newProcess',
    deleteProcess = 'deleteProcess',
    archivedProcess = 'archivedProcess',
    dateAboutToExpire = 'dateAboutToExpire',
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
    process: IMongoProcessInstancePopulated | null;
    addedSteps: (IMongoStepInstancePopulated | null)[];
    deletedSteps: (IMongoStepInstancePopulated | null)[];
    unchangedSteps: (IMongoStepInstancePopulated | null)[];
}
export interface IProcessStatusUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
    step?: IMongoStepInstancePopulated | null;
    status: Status;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
}
export interface IDeleteProcessNotificationMetadataPopulated {
    processName: string;
}
export interface IArchiveProcessNotificationMetadataPopulated {
    process: IMongoProcessInstancePopulated | null;
    isArchived?: boolean;
}
export interface IDateAboutToExpireMetadataPopulated {
    entity: IEntity | null;
    propertyName: string;
    datePropertyValue: Date;
}
export type INotificationMetadataPopulated =
    | IRuleBreachAlertNotificationMetadataPopulated
    | IRuleBreachRequestNotificationMetadataPopulated
    | IRuleBreachResponseNotificationMetadataPopulated
    | IProcessReviewerUpdateNotificationMetadataPopulated
    | IProcessStatusUpdateNotificationMetadataPopulated
    | INewProcessNotificationMetadataPopulated
    | IDateAboutToExpireMetadataPopulated
    | IDeleteProcessNotificationMetadataPopulated
    | IArchiveProcessNotificationMetadataPopulated;

export interface INotificationPopulated<T = INotificationMetadataPopulated> {
    type: NotificationType;
    metadata: T;
    createdAt: Date;
    _id: string;
}

export const isDeleteProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IDeleteProcessNotificationMetadataPopulated> => {
    return notification.type === NotificationType.deleteProcess;
};
export const isArchiveProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IArchiveProcessNotificationMetadataPopulated> => {
    return notification.type === NotificationType.archivedProcess;
};
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

export const isDateAboutToExpireNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IDateAboutToExpireMetadataPopulated> => notification.type === NotificationType.dateAboutToExpire;

export type INotificationCountGroups = Record<string, NotificationType[]>;
export interface INotificationGroupCountDetails {
    groups: Record<string, number>;
    total: number;
}
