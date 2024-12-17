import {
    IExternalUser,
    IUser,
    IUserSearchBody,
    ICompactNullablePermissions,
    ICompactPermissions,
    IPermission,
    ISubCompactPermissions,
    RecursiveNullable,
} from '@microservices/shared';
import axios from '../axios';
import { environment } from '../globals';

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
    const { data } = await axios.post<{ users: IUser[]; count: number }>(`${users}/search`, searchBody);
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

export const syncUserPermissionsRequest = async (userId: string, permissions: ICompactNullablePermissions) => {
    const { data } = await axios.post<ICompactPermissions>(`${users}/${userId}/permissions/sync`, permissions);
    return data;
};

export const searchExternalUsersRequest = async (search: string, workspaceId?: string) => {
    if (search.length < 2) return [];
    const { data } = await axios.get<IExternalUser[]>(`${users}/external`, { params: { search, workspaceId } });
    return data;
};

export const deletePermissionsFromMetadata = async (
    query: Pick<IPermission, 'type' | 'workspaceId'> & { userId?: IPermission['userId'] },
    metadata: RecursiveNullable<ISubCompactPermissions>,
) => {
    const { data } = await axios.patch<void>(`${users}/metadata`, { query, metadata });
    return data;
};
