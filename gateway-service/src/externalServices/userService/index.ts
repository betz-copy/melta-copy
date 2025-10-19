import axios from 'axios';
import {
    IBaseUser,
    IUser,
    IUserSearchBody,
    ICompactNullablePermissions,
    ICompactPermissions,
    IPermission,
    ISubCompactPermissions,
    DeepPartial,
    RecursiveNullable,
    IRole,
    IBaseRole,
    RelatedPermission,
    IUserPopulated,
} from '@microservices/shared';
import config from '../../config';

const {
    userService: { url, usersRoute, rolesRoute, permissionsRoute, requestTimeout },
} = config;

class UserService {
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

    static async searchUsers(searchBody: IUserSearchBody): Promise<{ users: IUserPopulated[]; count: number }> {
        const { data } = await this.userService.post<{ users: IUserPopulated[]; count: number }>(`${usersRoute}/search`, searchBody);
        return data;
    }

    static async createUser(userData: Omit<IUser, '_id' | 'displayName'>): Promise<IUser> {
        const { data } = await this.userService.post<IUser>(usersRoute, userData);
        return data;
    }

    static async updateUser(userId: string, updates: DeepPartial<IBaseUser>): Promise<IUser> {
        const { data } = await this.userService.patch<IUser>(`${usersRoute}/${userId}`, {
            ...updates,
            roleIds: updates.roleIds ?? null,
        });
        return data;
    }

    static async searchUsersByPermissions(workspaceId: string) {
        const { data } = await this.userService.get<IUser[]>(`${usersRoute}/search/${workspaceId}`);
        return data;
    }

    static async getRelatedPermissions(userId: string, permissionType: RelatedPermission, workspaceIds?: string[]): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/find-by-related-id/${userId}`, {
            workspaceIds,
            permissionType,
        });
        return data;
    }

    static async syncPermissions(
        relatedId: string,
        permissionType: RelatedPermission,
        permissions: ICompactNullablePermissions | ICompactPermissions,
        dontDeleteUser?: boolean,
    ): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/sync`, {
            relatedId,
            permissionType,
            permissions,
            dontDeleteUser,
        });
        return data;
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { relatedId?: IPermission['relatedId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ) {
        const { data } = await this.userService.patch<void>(`${permissionsRoute}/metadata`, { query, metadata });
        return data;
    }

    static async getRoleById(roleId: string, workspaceIds?: string[]): Promise<IRole> {
        const { data } = await this.userService.post<IRole>(`${rolesRoute}/find-by-id/${roleId}`, { workspaceIds });
        return data;
    }

    static async searchRoleIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await this.userService.post<string[]>(`${rolesRoute}/search-ids`, searchBody);
        return data;
    }

    static async searchRoles(searchBody: IUserSearchBody): Promise<{ roles: IRole[]; count: number }> {
        const { data } = await this.userService.post<{ roles: IRole[]; count: number }>(`${rolesRoute}/search`, searchBody);
        return data;
    }

    static async createRole(roleData: Omit<IRole, '_id'>): Promise<IRole> {
        const { data } = await this.userService.post<IRole>(rolesRoute, roleData);
        return data;
    }

    static async updateRole(roleId: string, updates: DeepPartial<IBaseRole>): Promise<IRole> {
        const { data } = await this.userService.patch<IRole>(`${rolesRoute}/${roleId}`, updates);
        return data;
    }

    static async searchRolesByPermissions(workspaceId: string) {
        const { data } = await this.userService.get<IRole[]>(`${rolesRoute}/search/${workspaceId}`);
        return data;
    }

    static async getUserRolePerWorkspace(workspaceId: string, roleIds: string[]) {
        const { data } = await this.userService.post<IRole>(`${rolesRoute}/userRoleWorkspace/${workspaceId}`, { roleIds });
        return data;
    }

    static async getAllWorkspaceRoles(workspaceIds: string[]) {
        const { data } = await this.userService.post<IRole[]>(`${rolesRoute}/workspaces`, { workspaceIds });
        return data;
    }
}

export default UserService;
