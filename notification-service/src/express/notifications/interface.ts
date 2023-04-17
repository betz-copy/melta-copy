import { Document } from 'mongoose';
import { ProcessStatus } from '../../utils/interfaces/processes';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',

    processApproverUpdate = 'processApproverUpdate',
    processStatusUpdate = 'processStatusUpdate',
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
    previousApproverStepIds?: string[];
}
interface IProcessStatusUpdateMetadata {
    processId: string;
    stepId?: string;
    status: ProcessStatus;
}
interface INewProcessMetadata {
    processId: string;
}

type INotificationMetadata =
    | IRuleBreachAlertMetadata
    | IRuleBreachRequestMetadata
    | IRuleBreachResponseMetadata
    | IProcessApproverUpdateMetadata
    | IProcessStatusUpdateMetadata
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
