import { Document } from 'mongoose';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
    processApproverUpdate = 'processApproverUpdate',
    newProcess = 'newProcess',
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

interface IProcessApproverUpdateMetadata {
    processId: string;
    approverStepIds: string[];
}
interface INewProcessMetadata {
    processId: string;
}

type INotificationMetadata =
    | IRuleBreachAlertMetadata
    | IRuleBreachRequestMetadata
    | IRuleBreachResponseMetadata
    | IProcessApproverUpdateMetadata
    | INewProcessMetadata;

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
