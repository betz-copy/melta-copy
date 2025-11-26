import {
    DeepPartial,
    IBaseRole,
    IBaseUser,
    ICompactNullablePermissions,
    ICompactPermissions,
    IGetUnits,
    IMongoUnit,
    IPermission,
    IRole,
    ISubCompactPermissions,
    IUnit,
    IUnitHierarchy,
    IUser,
    IUserPopulated,
    IUserSearchBody,
    RecursiveNullable,
    RelatedPermission,
} from '@microservices/shared';
import axios from 'axios';
import config from '../../config';

const { url, usersRoute, rolesRoute, permissionsRoute, unitsRoute, requestTimeout } = config.userService;

class UserService {
    private static userService = axios.create({
        baseURL: url,
        timeout: requestTimeout,
    });

    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        const { data } = await UserService.userService.post<IUser>(`${usersRoute}/find-by-id/${userId}`, { workspaceIds });
        return data;
    }

    static async getUserByExternalId(userExternalId: string, workspaceIds?: string[]): Promise<IUser> {
        const { data } = await UserService.userService.post<IUser>(`${usersRoute}/find-by-external-id/${userExternalId}`, { workspaceIds });
        return data;
    }

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await UserService.userService.post<string[]>(`${usersRoute}/search-ids`, searchBody);
        return data;
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<{ users: IUserPopulated[]; count: number }> {
        const { data } = await UserService.userService.post<{ users: IUserPopulated[]; count: number }>(`${usersRoute}/search`, searchBody);
        return data;
    }

    static async createUser(userData: Omit<IUser, '_id' | 'displayName'>): Promise<IUser> {
        const { data } = await UserService.userService.post<IUser>(usersRoute, userData);
        return data;
    }

    static async updateUser(userId: string, updates: DeepPartial<IBaseUser>): Promise<IUser> {
        const { data } = await UserService.userService.patch<IUser>(`${usersRoute}/${userId}`, {
            ...updates,
            roleIds: updates.roleIds ?? null,
        });
        return data;
    }

    static async searchUsersByPermissions(workspaceId: string) {
        const { data } = await UserService.userService.get<IUser[]>(`${usersRoute}/search/${workspaceId}`);
        return data;
    }

    static async getRelatedPermissions(userId: string, permissionType: RelatedPermission, workspaceIds?: string[]): Promise<ICompactPermissions> {
        const { data } = await UserService.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/find-by-related-id/${userId}`, {
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
        const { data } = await UserService.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/sync`, {
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
        const { data } = await UserService.userService.patch<void>(`${permissionsRoute}/metadata`, { query, metadata });
        return data;
    }

    static async getRoleById(roleId: string, workspaceIds?: string[]): Promise<IRole> {
        const { data } = await UserService.userService.post<IRole>(`${rolesRoute}/find-by-id/${roleId}`, { workspaceIds });
        return data;
    }

    static async searchRoleIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await UserService.userService.post<string[]>(`${rolesRoute}/search-ids`, searchBody);
        return data;
    }

    static async searchRoles(searchBody: IUserSearchBody): Promise<{ roles: IRole[]; count: number }> {
        const { data } = await UserService.userService.post<{ roles: IRole[]; count: number }>(`${rolesRoute}/search`, searchBody);
        return data;
    }

    static async createRole(roleData: Omit<IRole, '_id'>): Promise<IRole> {
        const { data } = await UserService.userService.post<IRole>(rolesRoute, roleData);
        return data;
    }

    static async updateRole(roleId: string, updates: DeepPartial<IBaseRole>): Promise<IRole> {
        const { data } = await UserService.userService.patch<IRole>(`${rolesRoute}/${roleId}`, updates);
        return data;
    }

    static async searchRolesByPermissions(workspaceId: string) {
        const { data } = await UserService.userService.get<IRole[]>(`${rolesRoute}/search/${workspaceId}`);
        return data;
    }

    static async getUserRolePerWorkspace(workspaceId: string, roleIds: string[]) {
        const { data } = await UserService.userService.post<IRole>(`${rolesRoute}/userRoleWorkspace/${workspaceId}`, { roleIds });
        return data;
    }

    static async getAllWorkspaceRoles(workspaceIds: string[]) {
        const { data } = await UserService.userService.post<IRole[]>(`${rolesRoute}/workspaces`, { workspaceIds });
        return data;
    }

    static async getUnits(params: Partial<IUnit> & Pick<IUnit, 'workspaceId'>) {
        const { data } = await UserService.userService.get<IGetUnits>(`${unitsRoute}`, { params });
        return data;
    }

    static async getUnitsByIds(ids: string[]) {
        const { data } = await UserService.userService.post<IMongoUnit[]>(`${unitsRoute}/ids`, { ids });
        return data;
    }

    static async createUnit(unit: IUnit) {
        const { data } = await UserService.userService.post<IMongoUnit>(`${unitsRoute}`, unit);
        return data;
    }

    static async updateUnit(id: string, update: Partial<IUnit>) {
        const { data } = await UserService.userService.patch<IMongoUnit>(`${unitsRoute}/${id}`, update);
        return data;
    }

    static async getUnitHierarchy(workspaceId: string) {
        const { data } = await UserService.userService.get<IUnitHierarchy[]>(`${unitsRoute}/${workspaceId}/hierarchy`);
        return data;
    }
}

export default UserService;
