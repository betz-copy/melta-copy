import axios from 'axios';
import { IUser } from '@microservices/shared';
import config from './config';
import { trycatch } from './utils';

const { url, usersRoute, isAliveRoute } = config.usersService;

const createUser = async (user: Omit<IUser, '_id'>) => {
    const { data } = await axios.post<IUser>(`${url}${usersRoute}`, user);
    return data;
};

export const createUsers = async (users: Omit<IUser, '_id'>[]) => {
    return Promise.all(users.map(createUser));
};

export const isUserServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
