import axios from 'axios';
import config from '../config';

const { uri, baseRoute, requestTimeout } = config.notificationService;

export interface IAlertMetadata {
    alertId: string;
}
export interface IRequestMetadata {
    requestId: string;
}
export interface IResponseMetadata {
    requestId: string;
}

export type INotificationMetadata = IAlertMetadata | IRequestMetadata | IResponseMetadata;

export enum NotificationType {
    ruleBreachAlert = 'ruleBreachAlert',
    ruleBreachRequest = 'ruleBreachRequest',
    ruleBreachResponse = 'ruleBreachResponse',
}

export interface INotification<T = INotificationMetadata> {
    viewers: string[];
    type: NotificationType;
    metadata: T;
    createdAt: Date;
}
export type IBasicNotification = Omit<INotification, 'viewers'>;

export class NotificationService {
    private static notificationService = axios.create({
        baseURL: `${uri}${baseRoute}`,
        timeout: requestTimeout,
    });

    static async getNotifications(query: object): Promise<INotification[]> {
        const { data } = await this.notificationService.get<INotification[]>('/', { params: query });
        return data;
    }

    static async getNotificationCount(query: object): Promise<number> {
        const { data } = await this.notificationService.get<number>('/count', { params: query });
        return data;
    }

    static async notificationsSeen(notificationId: string, viewerId: string): Promise<INotification> {
        const { data } = await this.notificationService.patch<INotification>(`/${notificationId}/seen`, { viewerId });
        return data;
    }
}
