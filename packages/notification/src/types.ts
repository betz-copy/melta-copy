import { IEntity } from '@packages/entity';
import { IMongoProcessInstanceReviewerPopulated, IMongoStepInstancePopulated, Status } from '@packages/process';
import { IRuleMail } from '@packages/rule';
import { IRuleBreachAlertPopulated, IRuleBreachRequestPopulated } from '@packages/rule-breach';

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

export interface IRuleBreachAlertNotificationMetadata {
    alertId: string;
}

export interface IRuleBreachRequestNotificationMetadata {
    requestId: string;
}
export interface IRuleBreachResponseNotificationMetadata {
    requestId: string;
}

export interface IRuleIndicatorAlertNotificationMetadata {
    entityId: string;
    email: IRuleMail;
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
    | IRuleIndicatorAlertNotificationMetadata
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
    _id: string;
    notificationDate?: Date;
}

export type INotificationCountGroups = Record<string, NotificationType[]>;

export interface INotificationGroupCountDetails {
    groups: Record<string, number>;
    total: number;
}

export interface IBasicNotificationQuery {
    types?: NotificationType[];
    startDate?: Date;
    endDate?: Date;
    viewerId?: string;
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

export interface IRuleIndicatorAlertNotificationMetadataPopulated {
    entity: IEntity;
    email: IRuleMail;
}

export interface IProcessReviewerUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | null;
    addedSteps: (IMongoStepInstancePopulated | null)[];
    deletedSteps: (IMongoStepInstancePopulated | null)[];
    unchangedSteps: (IMongoStepInstancePopulated | null)[];
}
export interface IProcessStatusUpdateNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | null;
    step?: IMongoStepInstancePopulated | null;
    status: Status;
}
export interface INewProcessNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | null;
}
export interface IDeleteProcessNotificationMetadataPopulated {
    processName: string;
}
export interface IArchiveProcessNotificationMetadataPopulated {
    process: IMongoProcessInstanceReviewerPopulated | null;
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
    | IRuleIndicatorAlertNotificationMetadataPopulated
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

// This is the interface implimentation from gateway-service
// export interface INotificationPopulated<T = INotificationMetadataPopulated> extends Omit<INotification<T>, 'viewers'> {}
