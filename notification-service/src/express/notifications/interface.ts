import { Document } from 'mongoose';

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
}

interface IAlertMetadata {
    alertId: string;
}

interface IRequestMetadata {
    requestId: string;
}

interface IResponseMetadata {
    requestId: string;
}

type INotificationMetadata = IAlertMetadata | IRequestMetadata | IResponseMetadata;

export interface INotification {
    viewers: string[];
    type: NotificationType;
    metadata: INotificationMetadata;
    createdAt: Date;
}

export type INotificationDocument = INotification & Document;
