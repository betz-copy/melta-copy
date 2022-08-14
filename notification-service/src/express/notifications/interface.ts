import { Document } from 'mongoose';

export const notificationType = ['ruleBreachAlert', 'ruleBreachRequest', 'ruleBreachResponse'];

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
    type: typeof notificationType[number];
    metadata: INotificationMetadata;
    createdAt: Date;
}

export type INotificationDocument = INotification & Document;
