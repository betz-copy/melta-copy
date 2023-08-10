import { Document } from 'mongoose';
import { ProcessStatus } from '../../utils/interfaces/processes';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',

    processReviewerUpdate = 'processReviewerUpdate',
    processStatusUpdate = 'processStatusUpdate',
    newProcess = 'newProcess',

    dateAboutToExpire = 'dateAboutToExpire',
}

interface IRuleBreachAlertMetadata {
    alertId: string;
}
interface IRuleBreachRequestMetadata {
    requestId: string;
}
interface IRuleBreachResponseMetadata {
    requestId: string;
}

interface IProcessReviewerUpdateMetadata {
    processId: string;
    addedStepIds: string[];
    deletedStepIds: string[];
    unchangedStepIds: string[];
}
interface IProcessStatusUpdateMetadata {
    processId: string;
    stepId?: string;
    status: ProcessStatus;
}
interface INewProcessMetadata {
    processId: string;
}

interface IDateAboutToExpireMetadata {
    entityId: string;
    propertyName: string;
    datePropertyValue: Date;
}

type INotificationMetadata =
    | IRuleBreachAlertMetadata
    | IRuleBreachRequestMetadata
    | IRuleBreachResponseMetadata
    | IProcessReviewerUpdateMetadata
    | IProcessStatusUpdateMetadata
    | INewProcessMetadata
    | IDateAboutToExpireMetadata;

export interface INotification {
    viewers: string[];
    type: NotificationType;
    metadata: INotificationMetadata;
    createdAt: Date;
}

export type INotificationDocument = INotification & Document;

export type INotificationCountGroups = Record<string, NotificationType[]>;
export interface INotificationGroupCountDetails {
    groups: Record<string, number>;
    total: number;
}

export interface IBasicNotificationQuery {
    types?: NotificationType[];
    viewerId?: string;
}
