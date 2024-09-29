import axios from 'axios';
import config from '../../config';
import { DeepPartial, RecursiveNullable } from '../../utils/types';
import { ICompactNullablePermissions, ICompactPermissions, IPermission, ISubCompactPermissions } from './interfaces/permissions/permissions';
import { IBaseUser, IUser, IUserSearchBody } from './interfaces/users';

const {
    userService: { url, usersRoute, permissionsRoute, requestTimeout },
} = config;

export class UserService {
    private static userService = axios.create({
        baseURL: url,
        timeout: requestTimeout,
    });

    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        const { data } = await this.userService.post<IUser>(`${usersRoute}/find-by-id/${userId}`, { workspaceIds });
        return data;
    }

    static async getUserByExternalId(userExternalId: string, workspaceIds?: string[]): Promise<IUser> {
        const { data } = await this.userService.post<IUser>(`${usersRoute}/find-by-external-id/${userExternalId}`, { workspaceIds });
        return data;
    }

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await this.userService.post<string[]>(`${usersRoute}/search-ids`, searchBody);
        return data;
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<IUser[]> {
        const { data } = await this.userService.post<IUser[]>(`${usersRoute}/search`, searchBody);
        return data;
    }

    static async createUser(userData: Omit<IUser, '_id' | 'displayName'>): Promise<IUser> {
        const { data } = await this.userService.post<IUser>(usersRoute, userData);

        return data;
    }

    static async updateUser(userId: string, updates: DeepPartial<IBaseUser>): Promise<IUser> {
        const { data } = await this.userService.patch<IUser>(`${usersRoute}/${userId}`, updates);
        return data;
    }

    // static async updateUserPreferencesMetadata(userId: string, preferences: DeepPartial<IBaseUser>): Promise<IUser> {
    //     const { data } = await this.userService.patch<IUser>(`${usersRoute}/preferences/${userId}`, preferences);
    //     return data;
    // }

    static async getUserPermissions(userId: string, workspaceIds?: string[]): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/find-by-user-id/${userId}`, { workspaceIds });
        return data;
    }

    static async syncUserPermissions(userId: string, permissions: ICompactNullablePermissions | ICompactPermissions): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/sync`, { userId, permissions });
        return data;
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { userId?: IPermission['userId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ) {
        const { data } = await this.userService.patch<void>(`${permissionsRoute}/metadata`, { query, metadata });
        return data;
    }
}
