import {
    IBaseUser,
    ICompactNullablePermissions,
    ICompactPermissions,
    IExternalUser,
    IGetUnits,
    IKartoffelUser,
    IMongoRole,
    IMongoUnit,
    IMongoUser,
    IPermission,
    IRole,
    ISubCompactPermissions,
    IUnit,
    IUnitHierarchy,
    IUser,
    IUserPopulated,
    IUserPreferences,
    IUserSearchBody,
    NotificationType,
    RelatedPermission,
} from '@microservices/shared';
import axios from '../axios';
import { environment } from '../globals';
import { RecursiveNullable } from '../utils/types';

const {
    api: { users, roles, units },
} = environment;

export const getMyUserRequest = async () => {
    const { data } = await axios.get<IUser>(`${users}/my`);
    return data;
};

export const getUserByIdRequest = async (userId: string) => {
    const { data } = await axios.get<IUser>(`${users}/${userId}`);
    return data;
};

export const getKartoffelUserProfileRequest = async (kartoffelId: string) => {
    const { data } = await axios.get(`${users}/kartoffelUserProfile/${kartoffelId}`, { responseType: 'blob' });
    return URL.createObjectURL(data);
};

export const searchUsersRequest = async (searchBody: IUserSearchBody) => {
    const { data } = await axios.post<{ users: IUserPopulated[]; count: number }>(`${users}/search`, searchBody);
    return data;
};

export const createUserRequest = async (
    kartoffelId: string,
    permissions: ICompactPermissions,
    workspaceId: string,
    roleIds?: string[],
    units?: Record<string, string[]>,
) => {
    const { data } = await axios.post<IUser>(users, { kartoffelId, permissions, workspaceId, roleIds, units });
    return data;
};

export const updateUserRequest = async (id: string, update: Partial<IBaseUser>) => {
    const { data } = await axios.patch<IUser>(`${users}/${id}`, update);
    return data;
};

export const updateUserPreferencesMetadataRequest = async (
    userId: string,
    profilePreference: IUserPreferences,
    notificationsToShowCheckbox: NotificationType[],
    darkMode?: boolean,
) => {
    const formData = new FormData();
    if (profilePreference.icon?.file instanceof File) {
        formData.append('file', profilePreference.icon.file);
    } else if (profilePreference.icon) {
        formData.append('profilePath', profilePreference.icon.file.name!);
    } else if (profilePreference.profilePath) {
        formData.append('profilePath', profilePreference.profilePath);
    }
    formData.append('mailsNotificationsTypes', JSON.stringify(notificationsToShowCheckbox));
    if (darkMode !== undefined) formData.append('darkMode', JSON.stringify(darkMode));

    const { data } = await axios.patch<IUser>(`${users}/${userId}/preferences`, formData);
    return data;
};

export const updateUserRoleIdsRequest = async (
    userId: string,
    workspaceId: string,
    permissions: ICompactNullablePermissions,
    roleIds?: IUser['roleIds'],
) => {
    const { data } = await axios.patch<IUser>(`${users}/${userId}/roleIds`, { workspaceId, roleIds, permissions });
    return data;
};

export const syncPermissionsRequest = async (
    relatedId: string,
    permissionType: RelatedPermission,
    permissions: ICompactNullablePermissions,
    dontDeleteUser?: boolean,
) => {
    const { data } = await axios.post<ICompactPermissions>(`${users}/${relatedId}/permissions/sync`, {
        permissionType,
        permissions,
        dontDeleteUser,
    });
    return data;
};

export const searchExternalUsersRequest = async (search: string, workspaceId?: string, isKartoffelUser?: boolean) => {
    if (search.length < 2) return [];
    const { data } = await axios.get<IExternalUser[] | IKartoffelUser[]>(`${users}/external`, { params: { search, workspaceId, isKartoffelUser } });
    return data;
};

export const deletePermissionsFromMetadata = async (
    query: Pick<IPermission, 'type' | 'workspaceId'> & { relatedId?: IPermission['relatedId'] },
    metadata: RecursiveNullable<ISubCompactPermissions>,
) => {
    const { data } = await axios.patch<void>(`${users}/metadata`, { query, metadata });
    return data;
};

export const getUserProfileRequest = async (user: Partial<IUser>) => {
    const { data } = await axios.get(`${users}/user-profile/${user._id}`, { responseType: 'blob' });
    return URL.createObjectURL(data);
};

export const searchUsersByPermissions = async (workspaceId: string, search?: string): Promise<IMongoUser[]> => {
    const params = search ? { search } : undefined;

    const { data } = await axios.get<IMongoUser[]>(`${users}/search/${workspaceId}`, { params });
    return data;
};

export const getRoleByIdRequest = async (roleId: string) => {
    const { data } = await axios.get<IRole>(`${roles}/${roleId}`);
    return data;
};

export const searchRolesRequest = async (searchBody: IUserSearchBody) => {
    const { data } = await axios.post<{ roles: IRole[]; count: number }>(`${roles}/search`, searchBody);
    return data;
};

export const createRoleRequest = async (name: string, permissions: ICompactPermissions) => {
    const { data } = await axios.post<IRole>(roles, { name, permissions });
    return data;
};

export const updateRoleRequest = async (roleId: string, name: string) => {
    const { data } = await axios.patch<IRole>(`${roles}/${roleId}`, { name });
    return data;
};

export const searchRolesByPermissionsRequest = async (workspaceId: string): Promise<IMongoRole[]> => {
    const { data } = await axios.get<IMongoRole[]>(`${roles}/search/${workspaceId}`);
    return data;
};

export const getUserRolePerWorkspaceRequest = async (workspaceId: string, roleIds: string[]) => {
    const { data } = await axios.post<IRole>(`${users}/userRoleWorkspace/${workspaceId}`, { roleIds });
    return data;
};

export const getAllWorkspaceRolesRequest = async (workspaceIds: string[]) => {
    const { data } = await axios.post<IRole[]>(`${users}/roles/workspaces`, { workspaceIds });
    return data;
};

export const getUnits = async (params: Partial<IUnit> & Pick<IUnit, 'workspaceId'>) => {
    const { data } = await axios.get<IGetUnits>(`${units}`, { params });
    return data;
};

export const createUnit = async (unit: Omit<IUnit, 'disabled'>) => {
    const { data } = await axios.post<IMongoUnit>(`${units}`, unit);
    return data;
};

export const updateUnit = async (id: string, update: Partial<IUnit>, shouldEffectChildren?: boolean) => {
    const { data } = await axios.patch<IMongoUnit>(`${units}/${id}`, { ...update, shouldEffectChildren });
    return data;
};

export const getUnitHierarchy = async (workspaceId: string) => {
    const { data } = await axios.get<IUnitHierarchy[]>(`${units}/${workspaceId}/hierarchy`);
    return data;
};
