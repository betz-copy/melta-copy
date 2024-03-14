// import { parse } from 'date-fns';
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
import moment from 'moment';
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
    // const v = query.startDate && new Date(query.startDate?.toLocaleDateString());
    // console.log(query.startDate?.toLocaleDateString(), typeof v);

    // const startDate = query.startDate && new Date(query.startDate);
    const startDate = query.startDate && query.startDate;
    // new Date(moment(query.startDate).format('YYYY-MM-DDTHH:mm:ss'));
    //
    console.log(query.startDate);

    // parse('2019-11-27 09:45:00', 'yyyy-MM-dd', new Date());
    const endDate = query.endDate && new Date(query.endDate.toDateString());
    console.log({ startDate }, { endDate }, typeof startDate);

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
