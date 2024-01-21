import axios from '../axios';
import { environment } from '../globals';
import { INotificationCountGroups, INotificationGroupCountDetails, INotificationPopulated, NotificationType } from '../interfaces/notifications';

const { notifications } = environment.api;

export const getMyNotificationsRequest = async (query: {
    limit: number;
    step?: number;
    types?: NotificationType[];
    startDate?: Date;
    endDate?: Date;
}) => {
    const { data } = await axios.get<INotificationPopulated[]>(`${notifications}/my`, { params: query });
    return data;
};

export const getMyNotificationCountRequest = async () => {
    const { data } = await axios.get<number>(`${notifications}/my/count`);
    return data;
};

export const getMyNotificationGroupCountRequest = async (groups: INotificationCountGroups) => {
    const { data } = await axios.post<INotificationGroupCountDetails>(`${notifications}/my/group-count`, { groups });
    return data;
};

export const notificationSeenRequest = async (notificationId: string) => {
    const { data } = await axios.post<INotificationPopulated>(`${notifications}/${notificationId}/seen`);
    return data;
};

export const manyNotificationSeenRequest = async (types: NotificationType[]) => {
    const { data } = await axios.post<INotificationPopulated[]>(`${notifications}/seen`, { types });
    return data;
};
