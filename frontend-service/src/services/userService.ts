import axios from '../axios';
import { environment } from '../globals';
import { NotificationType } from '../interfaces/notifications';
import { ICompactNullablePermissions, ICompactPermissions, IPermission, ISubCompactPermissions } from '../interfaces/permissions/permissions';
import { IMongoRole, IRole } from '../interfaces/roles';
import { IExternalUser, IKartoffelUser, IMongoUser, IUser, IUserPreferences, IUserSearchBody, RelatedPermission } from '../interfaces/users';
import { RecursiveNullable } from '../utils/types';

const {
    api: { users, roles },
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
    const { data } = await axios.post<{ users: IUser[]; count: number }>(`${users}/search`, searchBody);
    return data;
};

export const createUserRequest = async (kartoffelId: string, digitalIdentitySource: string, permissions: ICompactPermissions, roleId?: string) => {
    const { data } = await axios.post<IUser>(users, { kartoffelId, digitalIdentitySource, permissions, roleId });
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

export const updateUserExternalMetadataRequest = async (userId: string, kartoffelId: string, digitalIdentitySource: string) => {
    const { data } = await axios.patch<IUser>(`${users}/${userId}/externalMetadata`, { kartoffelId, digitalIdentitySource });
    return data;
};

export const updateUserRoleIdRequest = async (userId: string, roleId?: string) => {
    const { data } = await axios.patch<IUser>(`${users}/${userId}/roleId`, { roleId });
    return data;
};

export const syncPermissionsRequest = async (relatedId: string, permissionType: RelatedPermission, permissions: ICompactNullablePermissions) => {
    const { data } = await axios.post<ICompactPermissions>(`${users}/${relatedId}/permissions/sync`, { permissionType, permissions });
    return data;
};

export const searchExternalUsersRequest = async (search: string, workspaceId?: string, isKartoffelUser?: boolean) => {
    if (search.length < 2) return [];
    const { data } = await axios.get<IExternalUser[] | IKartoffelUser[]>(`${users}/external`, { params: { search, workspaceId, isKartoffelUser } });
    return data;
};

export const deletePermissionsFromMetadata = async (
    query: Pick<IPermission, 'type' | 'workspaceId'> & { userId?: IPermission['userId'] },
    metadata: RecursiveNullable<ISubCompactPermissions>,
) => {
    const { data } = await axios.patch<void>(`${users}/metadata`, { query, metadata });
    return data;
};

export const getUserProfileRequest = async (user: Partial<IUser>) => {
    const { data } = await axios.get(`${users}/user-profile/${user._id}`, { responseType: 'blob' });
    return URL.createObjectURL(data);
};

export const searchUsersByPermissions = async (workspaceId: string): Promise<IMongoUser[]> => {
    const { data } = await axios.get<IMongoUser[]>(`${users}/search/${workspaceId}`);
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

export const searchRolesByPermissions = async (workspaceId: string): Promise<IMongoRole[]> => {
    const { data } = await axios.get<IMongoRole[]>(`${roles}/search/${workspaceId}`);
    return data;
};
