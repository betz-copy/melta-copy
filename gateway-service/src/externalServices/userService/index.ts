import axios from 'axios';
import config from '../../config';
import { IBaseUser, IUser, IUserSearchBody } from './interfaces/users';
import { DeepPartial } from '../../utils/types';
import { ICompactPermissions } from './interfaces/permissions/permissions';

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

    static async createUser(userData: Omit<IUser, '_id'>): Promise<IUser> {
        const { data } = await this.userService.post<IUser>(usersRoute, userData);
        return data;
    }

    static async updateUser(userId: string, updates: DeepPartial<IBaseUser>): Promise<IUser> {
        const { data } = await this.userService.patch<IUser>(`${usersRoute}/${userId}`, updates);
        return data;
    }

    static async syncUserPermissions(userId: string, permissions: any): Promise<ICompactPermissions> {
        const { data } = await this.userService.post<ICompactPermissions>(`${permissionsRoute}/compact/sync`, { userId, permissions });
        return data;
    }
}
