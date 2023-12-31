import axios from 'axios';
import config from './config';
import { trycatch } from './utils';

const { url, baseRoute, isAliveRoute } = config.permissionsService;

export const resourceTypeOptions = ['Templates', 'Instances', 'Permissions', 'Rules', 'Processes'] as const;
export type ResourceType = (typeof resourceTypeOptions)[number];

export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = (typeof scopeOptions)[number];

export interface IPermission {
    userId: string;
    resourceType: ResourceType;
    category: string;
    scopes: Scope[];
}

export interface IMongoPermission {
    _id: string;
}

const permissionsAxios = axios.create({
    baseURL: url,
});

export const createPermission = async (permission: IPermission) => {
    const { data } = await permissionsAxios.post<IMongoPermission>(baseRoute, permission);

    return data;
};

export const createPermissionsBulk = async (permissions: IPermission[]) => {
    const createdPermissionsPromises = permissions.map(createPermission);
    return Promise.all(createdPermissionsPromises);
};

export const isPermissionServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
