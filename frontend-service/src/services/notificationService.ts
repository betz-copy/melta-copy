import { INotificationCountGroups, INotificationGroupCountDetails, INotificationPopulated, NotificationType } from '@microservices/shared';
import axios from '../axios';
import { environment } from '../globals';

const { notifications } = environment.api;

export interface IGetMyNotificationsRequestQuery {
    limit: number;
    step?: number;
    types?: NotificationType[];
    startDate?: Date;
    endDate?: Date;
}

export const getMyNotificationsRequest = async (query: IGetMyNotificationsRequestQuery) => {
    const startDate = query.startDate && query.startDate.toDateString();
    const endDate = query.endDate && query.endDate.toDateString();

    const { data } = await axios.get<INotificationPopulated[]>(`${notifications}/my`, {
        params: { ...query, startDate, endDate },
    });
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
