/* eslint-disable no-param-reassign */

import {
    BadRequestError,
    DeepPartial,
    IBaseRole,
    IBaseUser,
    ICompactNullablePermissions,
    ICompactPermissions,
    IExternalUser,
    IPermission,
    IRole,
    ISubCompactPermissions,
    IUser,
    IUserPopulated,
    IUserSearchBody,
    RecursiveNullable,
    RelatedPermission,
    UploadedFile,
} from '@microservices/shared';
import { menash } from 'menashmq';
import config from '../../config';
import Kartoffel from '../../externalServices/kartoffel';
import { IKartoffelUser, IKartoffelUserDigitalIdentity } from '../../externalServices/kartoffel/interface';
import StorageService from '../../externalServices/storageService';
import UserService from '../../externalServices/userService';
import { isProfileFileType, objectContains } from '../../utils';
import { ExternalUserNotFound, KartoffelUserMissingDataError } from './error';

const {
    storageService: { usersGlobalBucketName },
    rabbit,
} = config;

class UsersManager {
    private static storageService = new StorageService(usersGlobalBucketName);

    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        return UserService.getUserById(userId, workspaceIds);
    }

    static async getKartoffelUserProfileRequest(kartoffelId: string) {
        return Kartoffel.getUserProfile(kartoffelId);
    }

    static async getKartoffelUserById(kartoffelId: string) {
        const kartoffelUser = await Kartoffel.getUserById(kartoffelId);
        return kartoffelUser;
    }

    static async getUserProfile(userId: string) {
        const user: IUser = await UserService.getUserById(userId);
        const { profilePath } = user.preferences;

        if (!profilePath) return null;

        if (profilePath === 'kartoffelProfile') {
            return UsersManager.getKartoffelUserProfileRequest(user.kartoffelId).catch(() => {
                throw new BadRequestError('kartoffel profile not found');
            });
        }

        return UsersManager.storageService.downloadProfileFile(profilePath);
    }

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchUserIds(searchBody);
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<{ users: IUserPopulated[]; count: number }> {
        return UserService.searchUsers(searchBody);
    }

    static async updateUserRoleIds(
        userId: string,
        workspaceId: string,
        updatedPermissions: IUser['permissions'],
        roleIds?: string[],
    ): Promise<IUser> {
        const existingUser = await UsersManager.getUserById(userId);
        const prevRole =
            existingUser.roleIds && existingUser.roleIds.length > 0
                ? await UsersManager.getUserRolePerWorkspace(workspaceId, existingUser.roleIds)
                : undefined;
        const updatedRole = roleIds && roleIds.length > 0 ? await UsersManager.getUserRolePerWorkspace(workspaceId, roleIds) : undefined;

        if (prevRole && roleIds?.includes(prevRole._id) && updatedRole && roleIds?.includes(updatedRole._id))
            throw new BadRequestError('only one role per workspace to user');

        const newRoleIdsSet = new Set(existingUser.roleIds);
        if (prevRole) newRoleIdsSet.delete(prevRole._id);
        if (updatedRole) newRoleIdsSet.add(updatedRole._id);
        const updatedRoleIds = Array.from(newRoleIdsSet);

        if (updatedRole === undefined) {
            // adding personal permissions
            const newUser = await UserService.updateUser(userId, { roleIds });
            const newPermissions = await UsersManager.syncUserPermissions(userId, RelatedPermission.User, updatedPermissions);
            return { ...newUser, permissions: newPermissions };
        }

        return UserService.updateUser(userId, { roleIds: updatedRoleIds });
    }

    private static validateDigitalIdentity(
        kartoffelId: string,
        digitalIdentity: Pick<IExternalUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'>,
    ) {
        if (!digitalIdentity.jobTitle) digitalIdentity.jobTitle = 'NONE';
        if (!digitalIdentity.hierarchy) digitalIdentity.hierarchy = 'NONE';

        if (!digitalIdentity.fullName || !digitalIdentity.mail) {
            throw new KartoffelUserMissingDataError(kartoffelId);
        }
    }

    static async createUser(kartoffelId: string, permissions: ICompactPermissions, workspaceId: string, roleIds?: string[]): Promise<IUser> {
        const existingUser = await UserService.getUserByExternalId(kartoffelId).catch(() => {});

        if (existingUser) return UsersManager.updateUserRoleIds(existingUser._id, workspaceId, permissions, roleIds);

        const { _id, displayName: _displayName, preferences, ...digitalIdentity } = await UsersManager.getExternalUser(kartoffelId);

        UsersManager.validateDigitalIdentity(kartoffelId, digitalIdentity);

        return UserService.createUser({
            ...(digitalIdentity as IUser),
            permissions,
            kartoffelId,
            preferences,
            roleIds,
        });
    }

    static async updateUserPreferencesMetadata(userId: string, preferences: Partial<IBaseUser['preferences']>, file?: UploadedFile) {
        const user = await UserService.getUserById(userId);
        const { profilePath: currentProfilePath } = user.preferences || {};
        const updates: Partial<IBaseUser['preferences']> = { ...preferences };

        const deleteCurrentProfileFile = async () => {
            if (currentProfilePath && isProfileFileType(currentProfilePath)) {
                await menash.send(
                    rabbit.deleteUnusedFilesQueue,
                    JSON.stringify({
                        fileIds: [currentProfilePath],
                        bucketName: config.storageService.usersGlobalBucketName,
                    }),
                );
            }
        };

        if (file) {
            await deleteCurrentProfileFile();
            const newProfilePath = await UsersManager.storageService.uploadFile(file);
            updates.profilePath = newProfilePath;
        } else if (currentProfilePath && (!preferences.profilePath || preferences.profilePath !== currentProfilePath)) {
            await deleteCurrentProfileFile();
            updates.profilePath = preferences.profilePath;
        }
        return UserService.updateUser(userId, { preferences: updates });
    }

    static async syncUserPermissions(
        relatedId: string,
        permissionType: RelatedPermission,
        permissions: ICompactNullablePermissions,
        dontDeleteUser?: boolean,
    ): Promise<ICompactPermissions> {
        return UserService.syncPermissions(relatedId, permissionType, permissions, dontDeleteUser);
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { relatedId?: IPermission['relatedId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ) {
        return UserService.deletePermissionsFromMetadata(query, metadata);
    }

    static async syncUser(userId: string): Promise<IUser> {
        const user = await UserService.getUserById(userId);

        const {
            _id,
            displayName: _displayName,
            permissions: _permissions,
            preferences: _preferences,
            ...digitalIdentity
        } = await UsersManager.getExternalUser(user.kartoffelId);

        UsersManager.validateDigitalIdentity(user.kartoffelId, digitalIdentity);
        if (objectContains(user, digitalIdentity)) return user;

        return UserService.updateUser(userId, digitalIdentity);
    }

    static async searchExternalUsers(search: string, isKartoffelUser: boolean, workspaceId?: string): Promise<IExternalUser[] | IKartoffelUser[]> {
        const kartoffelUsers: IKartoffelUser[] = await Kartoffel.searchUsers(search);

        if (isKartoffelUser) return kartoffelUsers;

        const normalizedKartoffelUsers = await Promise.all(
            kartoffelUsers.flatMap((kartoffelUser) => UsersManager.kartoffelUserToUser(kartoffelUser)),
        );
        return normalizedKartoffelUsers.flat().filter((normalizedKartoffelUser) => !normalizedKartoffelUser.permissions[workspaceId || '']);
    }

    static async getUsersByIdentityCard(
        identityCards: string[],
        isKartoffelUser: boolean = false,
        workspaceId?: string,
    ): Promise<IExternalUser[] | IKartoffelUser[]> {
        const kartoffelUsers = await Kartoffel.getUsersByIdentityCards(identityCards);

        if (isKartoffelUser) return kartoffelUsers;

        const normalizedKartoffelUsers = await Promise.all(
            kartoffelUsers.flatMap((kartoffelUser) => UsersManager.kartoffelUserToUser(kartoffelUser)),
        );

        return normalizedKartoffelUsers.flat().filter(({ permissions }) => !permissions[workspaceId || '']);
    }

    static async kartoffelUserToUser(kartoffelUser: IKartoffelUser): Promise<IExternalUser | never[]> {
        if (!kartoffelUser.digitalIdentities?.length) return [];

        return UsersManager.kartoffelUserDigitalIdentityToExternalUser(kartoffelUser.digitalIdentities?.[0], kartoffelUser);
    }

    private static async getExternalUser(kartoffelId: string): Promise<IExternalUser> {
        const kartoffelUser = await Kartoffel.getUserById(kartoffelId);

        const kartoffelDigitalIdentity = kartoffelUser.digitalIdentities?.[0];
        if (!kartoffelDigitalIdentity) throw new ExternalUserNotFound(kartoffelId);

        return UsersManager.kartoffelUserDigitalIdentityToExternalUser(kartoffelDigitalIdentity, kartoffelUser);
    }

    private static async kartoffelUserDigitalIdentityToExternalUser(
        digitalIdentity: IKartoffelUserDigitalIdentity,
        kartoffelUser: IKartoffelUser,
    ): Promise<IExternalUser> {
        const fullName =
            kartoffelUser.fullName || (kartoffelUser.firstName && kartoffelUser.lastName)
                ? `${kartoffelUser.firstName} ${kartoffelUser.lastName}`
                : undefined;
        const hierarchy = digitalIdentity.role?.hierarchy || kartoffelUser.hierarchy;
        const jobTitle = digitalIdentity.role?.jobTitle || kartoffelUser.jobTitle;
        const mail = digitalIdentity.mail || kartoffelUser.mail;

        const kartoffelId = kartoffelUser._id || kartoffelUser.id;
        if (!digitalIdentity.source || !kartoffelId) throw new KartoffelUserMissingDataError(kartoffelUser._id);

        const existingUser = await UserService.getUserByExternalId(kartoffelId).catch(() => ({}) as IUser);

        return {
            _id: kartoffelId,
            fullName,
            hierarchy,
            jobTitle,
            mail,
            displayName: `${fullName} - ${hierarchy}/${jobTitle}`,
            kartoffelId,
            preferences: existingUser.preferences,
            permissions: existingUser.permissions || {},
        };
    }

    static async searchUsersByPermissions(workspaceId: string): Promise<IUser[]> {
        return UserService.searchUsersByPermissions(workspaceId);
    }

    static async getRoleById(roleId: string, workspaceIds?: string[]): Promise<IRole> {
        return UserService.getRoleById(roleId, workspaceIds);
    }

    static async searchRoleIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchRoleIds(searchBody);
    }

    static async searchRoles(searchBody: IUserSearchBody): Promise<{ roles: IRole[]; count: number }> {
        return UserService.searchRoles(searchBody);
    }

    static async createRole(name: string, permissions: ICompactPermissions): Promise<IRole> {
        return UserService.createRole({ name, permissions });
    }

    static async updateRole(roleId: string, updates: DeepPartial<IBaseRole>): Promise<IRole> {
        return UserService.updateRole(roleId, updates);
    }

    static async searchRolesByPermissions(workspaceId: string): Promise<IRole[]> {
        return UserService.searchRolesByPermissions(workspaceId);
    }

    static async getUserRolePerWorkspace(workspaceId: string, roleIds: string[]): Promise<IRole> {
        return UserService.getUserRolePerWorkspace(workspaceId, roleIds);
    }

    static async getAllWorkspaceRoles(workspaceIds: string[]): Promise<IRole[]> {
        return UserService.getAllWorkspaceRoles(workspaceIds);
    }
}

export default UsersManager;
