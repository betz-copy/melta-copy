import axios from '../axios';
import { environment } from '../globals';
import { IUser } from './kartoffelService';

const { permissions } = environment.api;

export enum PermissionResourceType {
    Permissions = 'Permissions',
    Templates = 'Templates',
    Instances = 'Instances',
    Processes = 'Processes',
    Rules = 'Rules',
}
export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = (typeof scopeOptions)[number];

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: PermissionResourceType;
    category: string;
    scopes: Scope[];
}

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    processesManagementId: string | null;
    rulesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category' | 'scopes'>[];
}

const getMyPermissionsRequest = async () => {
    const { data } = await axios.get<IPermissionsOfUser>(`${permissions}/my`);
    return data;
};

const getAllPermissionsOfUsersRequest = async () => {
    const { data } = await axios.get<IPermissionsOfUser[]>(permissions);
    return data;
};

const createPermissionsBulkRequest = async (permissionsToCreate: Omit<IPermission, '_id'>[]) => {
    const { data } = await axios.post<IPermission[]>(`${permissions}/bulk`, permissionsToCreate);
    return data;
};

const updatePermissionsBulkRequest = async (permission: IPermission[]) => {
    const { data } = await axios.put<IPermission[]>(`${permissions}/bulk`, permission);

    return data;
};

const deletePermissionsBulkRequest = async (ids: string[]) => {
    const { data } = await axios.delete<IPermission[]>(permissions, { params: { ids } });
    return data;
};

export {
    getMyPermissionsRequest,
    getAllPermissionsOfUsersRequest,
    deletePermissionsBulkRequest,
    createPermissionsBulkRequest,
    updatePermissionsBulkRequest,
};
