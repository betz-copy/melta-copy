import { INotification } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    notificationService: { url, baseRoute, requestTimeout },
} = config;

class NotificationService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async getNotifications(query: object): Promise<INotification[]> {
        const { data } = await this.api.get<INotification[]>('/', { params: query });
        return data;
    }

    async getNotificationCount(query: object): Promise<number> {
        const { data } = await this.api.get<number>('/count', { params: query });
        return data;
    }

    async getNotificationGroupCount(query: object) {
        const { data } = await this.api.post('/group-count', query);
        return data;
    }

    async notificationSeen(notificationId: string, viewerId: string): Promise<INotification> {
        const { data } = await this.api.post<INotification>(`/${notificationId}/seen`, { viewerId });
        return data;
    }

    async manyNotificationsSeen(query: object): Promise<INotification[]> {
        const { data } = await this.api.post<INotification[]>(`/seen`, query);
        return data;
    }
}

export default NotificationService;
