import axios, { AxiosError } from 'axios';
import config from '../config';
import { trycatch } from '../utils';
import { StatusCodes } from 'http-status-codes';

const {
    kartoffel: { baseUrl, baseEntitiesRoute, fullNameRoute, requestTimeout, digitalIdentityRoute, idRoute, identifierRoute },
} = config;

const kartoffelService = axios.create({ baseURL: `${baseUrl}${baseEntitiesRoute}`, timeout: requestTimeout, params: { expanded: true } });

export interface IKartoffelUser {
    id: string;
    fullName: string;
    hierarchy?: string;
    jobTitle?: string;
    firstName: string;
    lastName: string;
    digitalIdentities: { uniqueId: string; source: string }[];
    mail?: string;
}

export const wrapKartoffelRequestForUiSearch = async (func: () => Promise<IKartoffelUser>) => {
    const { result, err } = await trycatch(func);

    if (err) {
        const axiosError = err as AxiosError;
        if (axiosError?.response?.status === StatusCodes.NOT_FOUND) {
            return [];
        }

        throw err;
    }

    if (result) {
        return [result];
    }

    return [];
};

export const getEntityById = async (id: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser>(`/${id}`);
    return data;
};

export const getUserByDigitalIdentity = async (digitalIdentity: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser>(`${digitalIdentityRoute}/${digitalIdentity}`);
    return data;
};

export const getUserByIdentifier = async (identifier: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser>(`${identifierRoute}/${identifier}`);
    return data;
};

export const getUserById = async (id: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser>(`${idRoute}/${id}`);
    return data;
};

export const searchUsersByName = async (fullName: string) => {
    const { data } = await kartoffelService.get<IKartoffelUser[]>(`${fullNameRoute}`, { params: { fullName } });
    return data;
};

export const isDomainUser = (str: string) => {
    return /^\S+@\S+\.\S+$/.test(str);
};

export const isIdentifier = (str: string) => {
    return /^(?:[0-9]{7}|[0-9]{9})$/.test(str);
};

export const isKartoffelId = (str: string) => {
    return /^[a-f0-9]{24}$/.test(str);
};
