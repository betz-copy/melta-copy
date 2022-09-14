import axios from 'axios';
import { menash } from 'menashmq';
import config from '../../config';
import { INotification, NotificationType } from './interfaces';

const {
    rabbit,
    notificationService: { uri, baseRoute, requestTimeout },
} = config;

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

    static async rabbitCreateNotification<T>(viewers: string[], type: NotificationType, metadata: T) {
        return menash.send(rabbit.notificationQueue, { viewers, type, metadata });
    }
}
