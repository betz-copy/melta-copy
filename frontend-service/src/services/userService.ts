/* eslint-disable no-promise-executor-return */
import axios from '../axios';
import { environment } from '../globals';
import { ICompactPermissions } from '../interfaces/permissions/permissions';
import { IExternalUser, IUser, IUserSearchBody } from '../interfaces/users';

const { users } = environment.api;

export const getMyUserRequest = async () => {
    const { data } = await axios.get<IUser>(`${users}/my`);
    return data;
};

export const getUserByIdRequest = async (userId: string) => {
    const { data } = await axios.get<IUser>(`${users}/${userId}`);
    return data;
};

export const searchUsersRequest = async (searchBody: IUserSearchBody) => {
    const { data } = await axios.post<IUser[]>(`${users}/search`, searchBody);
    return data;
};

export const createUserRequest = async (kartoffelId: string, digitalIdentitySource: string, permissions: ICompactPermissions) => {
    const { data } = await axios.post<IUser>(users, { kartoffelId, digitalIdentitySource, permissions });
    return data;
};

export const updateUserExternalMetadataRequest = async (userId: string, kartoffelId: string, digitalIdentitySource: string) => {
    const { data } = await axios.patch<IUser>(`${users}/${userId}/externalMetadata`, { kartoffelId, digitalIdentitySource });
    return data;
};

export const syncUserPermissionsRequest = async (userId: string, permissions: ICompactPermissions) => {
    const { data } = await axios.post<IUser>(`${users}/${userId}/permissions/sync`, permissions);
    return data;
};

export const searchExternalUsersRequest = async (search: string) => {
    if (search.length < 2) return [];
    const { data } = await axios.get<IExternalUser[]>(`${users}/external`, { params: { search } });
    return data;
};
