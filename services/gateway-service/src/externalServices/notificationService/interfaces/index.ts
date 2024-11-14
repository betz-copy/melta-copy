import { Status } from '@microservices/shared/src/interfaces/process/instances/process';
import { INotificationMetadataPopulated } from './populated';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',

    processReviewerUpdate = 'processReviewerUpdate',
    processStatusUpdate = 'processStatusUpdate',
    newProcess = 'newProcess',
    deleteProcess = 'deleteProcess',
    archivedProcess = 'archivedProcess',
    dateAboutToExpire = 'dateAboutToExpire',
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
export interface IDeleteProcessNotificationMetadata {
    processName: string;
}
export interface IArchiveProcessNotificationMetadata {
    processId: string;
    isArchived?: boolean;
}
export interface IDateAboutToExpireNotificationMetadata {
    entityId: string;
    propertyName: string;
    datePropertyValue: Date;
}

export type INotificationMetadata =
    | IRuleBreachAlertNotificationMetadata
    | IRuleBreachRequestNotificationMetadata
    | IRuleBreachResponseNotificationMetadata
    | IProcessReviewerUpdateNotificationMetadata
    | IProcessStatusUpdateNotificationMetadata
    | INewProcessNotificationMetadata
    | IDateAboutToExpireNotificationMetadata
    | IDeleteProcessNotificationMetadata
    | IArchiveProcessNotificationMetadata;

export interface INotification<T = INotificationMetadata> {
    viewers: string[];
    type: NotificationType;
    metadata: T;
    createdAt: Date;
}
export interface IMailNotification {
    viewers: string[];
    type: NotificationType;
    populatedMetaData: INotificationMetadataPopulated;
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
export const isDeleteProcessNotification = (
    notification: Partial<INotification>,
): notification is INotification<IDeleteProcessNotificationMetadata> => notification.type === NotificationType.deleteProcess;
export const isNewProcessNotification = (notification: Partial<INotification>): notification is INotification<INewProcessNotificationMetadata> =>
    notification.type === NotificationType.newProcess;
export const isArchiveProcessNotification = (
    notification: Partial<INotification>,
): notification is INotification<IArchiveProcessNotificationMetadata> => notification.type === NotificationType.archivedProcess;
export const isDateAboutToExpireNotification = (
    notification: Partial<INotification>,
): notification is INotification<IDateAboutToExpireNotificationMetadata> => notification.type === NotificationType.dateAboutToExpire;
