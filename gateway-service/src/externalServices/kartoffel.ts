import axios from 'axios';
import config from '../config';

const {
    kartoffel: { baseUrl, baseEntitiesRoute, searchRoute, requestTimeout },
} = config;

const kartoffelService = axios.create({ baseURL: baseUrl, timeout: requestTimeout, params: { expanded: true } });

export interface IKartoffelUser {
    id: string;
    fullName: string;
    hierarchy?: string;
    jobTitle?: string;
    digitalIdentities: { uniqueId: string; source: string }[];
}

export const searchKartoffelUsers = async (fullName: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser[]>(`${baseEntitiesRoute}${searchRoute}`, { params: { fullName } });
    return data;
};

export const getEntityById = async (id: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser>(`${baseEntitiesRoute}/${id}`);
    return data;
};
