/* eslint-disable no-param-reassign */
import { menash } from 'menashmq';
import config from '../../config';
import { Kartoffel } from '../../externalServices/kartoffel';
import { IKartoffelUser, IKartoffelUserDigitalIdentity } from '../../externalServices/kartoffel/interface';
import { StorageService } from '../../externalServices/storageService';
import { UserService } from '../../externalServices/userService';
import {
    ICompactNullablePermissions,
    ICompactPermissions,
    IPermission,
    ISubCompactPermissions,
} from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IExternalUser, IUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';
import { isProfileFileType, objectContains } from '../../utils';
import { removeTmpFile } from '../../utils/fs';
import { RecursiveNullable } from '../../utils/types';
import { DigitalIdentitySourceDoesNotExistsError, KartoffelUserMissingDataError } from './error';

const {
    storageService: { usersGlobalBucketName },
    rabbit,
} = config;
export class UsersManager {
    private static storageService = new StorageService(usersGlobalBucketName);

    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        return UserService.getUserById(userId, workspaceIds);
    }

    static async getKartoffelUserProfileRequest(kartoffelId: string) {
        return Kartoffel.getUserProfile(kartoffelId);
    }

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchUserIds(searchBody);
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<IUser[]> {
        return UserService.searchUsers(searchBody);
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

    static async createUser(kartoffelId: string, digitalIdentitySource: string, permissions: ICompactPermissions): Promise<IUser> {
        const existingUser = await UserService.getUserByExternalId(kartoffelId).catch(() => {});

        if (existingUser?.externalMetadata.digitalIdentitySource === digitalIdentitySource) {
            const newPermissions = await UsersManager.syncUserPermissions(existingUser._id, permissions);
            return { ...existingUser, permissions: { ...existingUser.permissions, ...newPermissions } };
        }

        const { _id, displayName, existingDigitalIdentitySource, preferences, ...digitalIdentity } = await this.getExternalUserDigitalIdentity(
            kartoffelId,
            digitalIdentitySource,
        );

        UsersManager.validateDigitalIdentity(kartoffelId, digitalIdentity);

        return UserService.createUser({
            ...(digitalIdentity as IUser),
            permissions,
            externalMetadata: { kartoffelId, digitalIdentitySource },
            preferences,
        });
    }

    static async updateUserExternalMetadata(userId: string, externalMetadata: Partial<IBaseUser['externalMetadata']>): Promise<IUser> {
        return UserService.updateUser(userId, { externalMetadata });
    }

    static async updateUserPreferencesMetadata(userId: string, preferences: Partial<IBaseUser['preferences']>, file?: Express.Multer.File) {
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
            const newProfilePath = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
            updates.profilePath = newProfilePath;
        } else if (currentProfilePath && (!preferences.profilePath || preferences.profilePath !== currentProfilePath)) {
            await deleteCurrentProfileFile();
            updates.profilePath = preferences.profilePath || undefined;
        }
        return UserService.updateUser(userId, { preferences: updates });
    }

    static async syncUserPermissions(userId: string, permissions: ICompactNullablePermissions): Promise<ICompactPermissions> {
        return UserService.syncUserPermissions(userId, permissions);
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { userId?: IPermission['userId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ) {
        return UserService.deletePermissionsFromMetadata(query, metadata);
    }

    static async syncUser(userId: string): Promise<IUser> {
        const user = await UserService.getUserById(userId);

        const { _id, displayName, permissions, preferences, existingDigitalIdentitySource, ...digitalIdentity } =
            await this.getExternalUserDigitalIdentity(user.externalMetadata.kartoffelId, user.externalMetadata.digitalIdentitySource);

        UsersManager.validateDigitalIdentity(user.externalMetadata.kartoffelId, digitalIdentity);
        if (objectContains(user, digitalIdentity)) return user;

        return UserService.updateUser(userId, digitalIdentity);
    }

    static async searchExternalUsers(search: string, workspaceId?: string): Promise<IExternalUser[]> {
        const kartoffelUsers: IKartoffelUser[] = await Kartoffel.searchUsers(search);

        const normalizedKartoffelUsers = await Promise.all(kartoffelUsers.flatMap((kartoffelUser) => this.kartoffelUserToUser(kartoffelUser)));

        return normalizedKartoffelUsers.filter(
            (normalizedKartoffelUser) =>
                !normalizedKartoffelUser.permissions[workspaceId || ''] ||
                normalizedKartoffelUser.externalMetadata.digitalIdentitySource !== normalizedKartoffelUser.existingDigitalIdentitySource,
        );
    }

    private static kartoffelUserToUser(kartoffelUser: IKartoffelUser): Promise<IExternalUser>[] {
        if (!kartoffelUser.digitalIdentities) throw new KartoffelUserMissingDataError(kartoffelUser._id);

        return kartoffelUser.digitalIdentities.map((kartoffelDigitalIdentity) =>
            this.kartoffelUserDigitalIdentityToExternalUser(kartoffelDigitalIdentity, kartoffelUser),
        );
    }

    private static async getExternalUserDigitalIdentity(kartoffelId: string, digitalIdentitySource: string): Promise<IExternalUser> {
        const kartoffelUser = await Kartoffel.getUserById(kartoffelId);

        const kartoffelDigitalIdentity = kartoffelUser.digitalIdentities?.find((digitalIdentity) => digitalIdentity.source === digitalIdentitySource);
        if (!kartoffelDigitalIdentity) throw new DigitalIdentitySourceDoesNotExistsError(digitalIdentitySource, kartoffelUser._id);

        return this.kartoffelUserDigitalIdentityToExternalUser(kartoffelDigitalIdentity, kartoffelUser);
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
            displayName: `[${digitalIdentity.source}] ${fullName} - ${hierarchy}/${jobTitle}`,
            externalMetadata: {
                kartoffelId,
                digitalIdentitySource: digitalIdentity.source,
            },
            preferences: existingUser.preferences,
            permissions: existingUser.permissions || {},
            existingDigitalIdentitySource: existingUser.externalMetadata?.digitalIdentitySource,
        };
    }
}
