import axios from 'axios';
import config from '../../config';
import { ShragaUser } from '../../utils/express/passport';
import { IBasicNotification, INotification } from './interface';

const { uri, baseRoute, requestTimeout } = config.notificationService;

export class NotificationsManager {
    private static notificationService = axios.create({
        baseURL: `${uri}${baseRoute}`,
        timeout: requestTimeout,
    });

    static async getMyNotifications(user: ShragaUser, query: object): Promise<IBasicNotification[]> {
        const { data } = await this.notificationService.get<INotification[]>('/', { params: { ...query, viewerId: user.id } });
        return data.map(this.transformNotification);
    }

    static async notificationsSeen(notificationId: string, user: ShragaUser): Promise<IBasicNotification> {
        const { data } = await this.notificationService.patch<INotification>(`/${notificationId}/seen`, { userId: user.id });
        return this.transformNotification(data);
    }

    static transformNotification = (notification: INotification): IBasicNotification => {
        const basicNotification: any = { ...notification };
        delete basicNotification.viewers;

        return basicNotification;
    };
}

export default NotificationsManager;
