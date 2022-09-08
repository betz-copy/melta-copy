import axios from '../axios';
import { environment } from '../globals';
import { INotificationPopulated } from '../interfaces/notifications';

const { notifications } = environment.api;

export const getMyNotificationsRequest = async (limit: number, step?: number, type?: string) => {
    const query: any = { limit };
    if (step) query.step = step;
    if (type) query.type = type;

    const { data } = await axios.get<INotificationPopulated[]>(`${notifications}/my`, { params: query });
    return data;
};

export const getMyNotificationCountRequest = async () => {
    const { data } = await axios.get<number>(`${notifications}/my/count`);
    return data;
};

export const NotificationSeenRequest = async (notificationId: string) => {
    const { data } = await axios.patch<number>(`${notifications}/${notificationId}/seen`);
    return data;
};
