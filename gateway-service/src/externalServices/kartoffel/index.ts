import axios from 'axios';
import config from '../../config';
import { IKartoffelUser } from './interface';

const {
    kartoffel: { url, baseEntitiesRoute, getByDigitalIdentityRoute, getByIdentifierRoute, getByFullNameRoute, getByIdRoute, requestTimeout },
} = config;

export class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static getUserByDigitalIdentity = async (digitalIdentity: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByDigitalIdentityRoute}/${digitalIdentity}`);
        return data;
    };

    static getUserByIdentifier = async (identifier: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByIdentifierRoute}/${identifier}`);
        return data;
    };

    static getUsersByName = async (fullName: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(`${getByFullNameRoute}`, { params: { fullName } });
        return data;
    };

    static getUserById = async (id: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByIdRoute}/${id}`);
        return data;
    };

    static isDomainUser = (str: string) => {
        return /^\S+@\S+\.\S+$/.test(str);
    };

    static isIdentifier = (str: string) => {
        return /^(?:[0-9]{7}|[0-9]{9})$/.test(str);
    };

    static isKartoffelId = (str: string) => {
        return /^[a-f0-9]{24}$/.test(str);
    };
}
