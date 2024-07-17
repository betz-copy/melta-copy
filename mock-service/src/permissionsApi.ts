import axios from 'axios';
import config from './config';
import { ICompactPermissions } from './interfaces/permissions/permissions';
import { SyncUserPermissions } from './mocks/permissionsApi';
import { trycatch } from './utils';

const { url, baseRoute, isAliveRoute } = config.permissionsService;

export const createPermission = async (permission: SyncUserPermissions) => {
    const { data } = await axios.post<ICompactPermissions>(`${url}${baseRoute}/compact/sync`, permission);
    return data;
};

export const createUserPermissions = async (permissions: SyncUserPermissions[]) => Promise.all(permissions.map(createPermission));

export const isPermissionServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
