import axios from 'axios';
import config from '../../config';
import { DeepPartial, RecursiveNullable } from '../../utils/types';
import { ICompactNullablePermissions, ICompactPermissions, IPermission, ISubCompactPermissions } from './interfaces/permissions/permissions';
import { IBaseUser, IUser, IUserSearchBody } from './interfaces/users';
import { ICompactNullableRoles, ICompactRoles, IRole, ISubCompactRoles } from './interfaces/roles/permissions';

const {
    userService: { url, usersRoute, rolesRoute, permissionsRoute, requestTimeout },
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

    static async searchUsers(searchBody: IUserSearchBody): Promise<{ users: IUser[]; count: number }> {
        const { data } = await this.userService.post<{ users: IUser[]; count: number }>(`${usersRoute}/search`, searchBody);
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

    static async searchUsersByPermissions(workspaceId: string) {
        const { data } = await this.userService.get<IUser[]>(`${usersRoute}/search/${workspaceId}`);
        return data;
    }

    static async getRolePermissions(roleName: string, workspaceIds?: string[]): Promise<ICompactRoles> {
        const { data } = await this.userService.post<ICompactRoles>(`${rolesRoute}/compact/find-by-role-name/${roleName}`, {
            workspaceIds,
        });
        return data;
    }

    static async syncRolePermissions(name: string, permissions: ICompactNullableRoles | ICompactRoles): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactRoles>(`${rolesRoute}/compact/sync`, { name, permissions });
        return data;
    }

    static async deleteRolePermissionsFromMetadata(
        query: Pick<IRole, 'type' | 'workspaceId'> & { name?: IRole['name'] },
        metadata: RecursiveNullable<ISubCompactRoles>,
    ) {
        const { data } = await this.userService.patch<void>(`${rolesRoute}/metadata`, { query, metadata });
        return data;
    }
}
