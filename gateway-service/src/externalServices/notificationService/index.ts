import axios from 'axios';
import { INotification } from './interfaces';
import config from '../../config';

const {
    notificationService: { url, baseRoute, requestTimeout },
} = config;

export class NotificationService {
    private static notificationService = axios.create({
        baseURL: `${url}${baseRoute}`,
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

    static async getNotificationGroupCount(query: object) {
        const { data } = await this.notificationService.post('/group-count', query);
        return data;
    }

    static async notificationSeen(notificationId: string, viewerId: string): Promise<INotification> {
        const { data } = await this.notificationService.post<INotification>(`/${notificationId}/seen`, { viewerId });
        return data;
    }

    static async manyNotificationsSeen(query: object): Promise<INotification[]> {
        const { data } = await this.notificationService.post<INotification[]>(`/seen`, query);
        return data;
    }
}
