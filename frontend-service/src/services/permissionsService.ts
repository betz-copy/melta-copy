// import { IServerSideGetRowsRequest } from 'ag-grid-community';
import axios from '../axios';
import { environment } from '../globals';
import { IUser } from './kartoffelService';

const { getMyPermissions, getAllPermissions, createPermissionsBulk, deletePermissionsBulk } = environment.api;

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: 'Permissions' | 'Templates' | 'Instances';
    category: string;
}

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category'>[];
}

const getMyPermissionsRequest = async () => {
    const { data } = await axios.get<IPermissionsOfUser>(getMyPermissions);
    return data;
};

const getAllPermissionsOfUsersRequest = async () => {
    const { data } = await axios.get<IPermissionsOfUser[]>(getAllPermissions);
    return data;
};

const createPermissionsBulkRequest = async (permissionsToCreate: Omit<IPermission, '_id'>[]) => {
    const { data } = await axios.post<IPermission[]>(createPermissionsBulk, permissionsToCreate);
    return data;
};

const deletePermissionsBulkRequest = async (ids: string[]) => {
    const { data } = await axios.delete<IPermission[]>(deletePermissionsBulk, { params: { ids } });
    return data;
};

export { getMyPermissionsRequest, getAllPermissionsOfUsersRequest, deletePermissionsBulkRequest, createPermissionsBulkRequest };
