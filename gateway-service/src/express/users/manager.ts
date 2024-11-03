/* eslint-disable no-param-reassign */
import config from '../../config';
import { Kartoffel } from '../../externalServices/kartoffel';
import { IKartoffelUser, IKartoffelUserDigitalIdentity } from '../../externalServices/kartoffel/interface';
import { StorageService } from '../../externalServices/storageService';
// import { NotificationType } from '../../externalServices/notificationService/interfaces';
import { UserService } from '../../externalServices/userService';
import {
    ICompactNullablePermissions,
    ICompactPermissions,
    IPermission,
    ISubCompactPermissions,
} from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IExternalUser, IUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';
import { objectContains } from '../../utils';
import { removeTmpFile } from '../../utils/fs';
import { RecursiveNullable } from '../../utils/types';
import { DigitalIdentitySourceDoesNotExistsError, KartoffelUserMissingDataError } from './error';

const { usersGlobalBucketName } = config.storageService;
export class UsersManager {
    private static storageService = new StorageService(usersGlobalBucketName);

    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        return UserService.getUserById(userId, workspaceIds);
    }

    static async getKartoffelUserById(kartoffelId: string): Promise<IKartoffelUser> {
        return Kartoffel.getUserById(kartoffelId);
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
        console.log('here?');

        return UserService.updateUser(userId, { externalMetadata });
    }

    static isProfileFileType(profilePath: string) {
        return profilePath !== '' && !profilePath.startsWith('/icons/profileAvatar') && !profilePath.startsWith('http://');
    }

    static async updateUserPreferencesMetadata(userId: string, preferences: Partial<IBaseUser['preferences']>, file?: Express.Multer.File) {
        const {
            preferences: { profilePath },
        } = await UserService.getUserById(userId);
        console.log({ preferences });

        console.log({ file, profilePath, preferences });
        if (file) {
            if (profilePath && this.isProfileFileType(profilePath)) {
                console.log('its ok');

                await UsersManager.storageService.deleteFile(profilePath);
            }
            const newProfilePath = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
            // preferences.profilePath = newProfilePath;
            return UserService.updateUser(userId, { preferences: { ...preferences, profilePath: newProfilePath } });
        }

        if (profilePath && (!preferences.profilePath || preferences.profilePath !== profilePath)) {
            console.log(preferences.profilePath ? 'Updating to a new profilePath' : 'Resetting to default profile path');

            await this.storageService.deleteFile(profilePath);
            return UserService.updateUser(userId, { preferences: { ...preferences, profilePath: preferences.profilePath || undefined } });
        }
        console.log('Final update without changes', { preferences });
        return UserService.updateUser(userId, { preferences });
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
        console.log('got the user ', { user });

        const { _id, displayName, permissions, existingDigitalIdentitySource, ...digitalIdentity } = await this.getExternalUserDigitalIdentity(
            user.externalMetadata.kartoffelId,
            user.externalMetadata.digitalIdentitySource,
        );

        UsersManager.validateDigitalIdentity(user.externalMetadata.kartoffelId, digitalIdentity);
        console.log('pass the validate');

        if (objectContains(user, digitalIdentity)) return user;
        console.log({ digitalIdentity });

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
        const profile = kartoffelUser.pictures?.profile?.url;
        if (!digitalIdentity.source || !kartoffelId) throw new KartoffelUserMissingDataError(kartoffelUser._id);

        const existingUser = await UserService.getUserByExternalId(kartoffelId).catch(() => ({}) as IUser);

        return {
            _id: kartoffelId,
            fullName,
            hierarchy,
            jobTitle,
            mail,
            displayName: `[${digitalIdentity.source}] ${fullName} - ${hierarchy}/${jobTitle}`,
            profile,
            externalMetadata: {
                kartoffelId,
                digitalIdentitySource: digitalIdentity.source,
            },
            preferences: {
                mailsNotificationsTypes: [],
                // darkMode: false,
                profilePath: profile,
            },
            permissions: existingUser.permissions || {},
            existingDigitalIdentitySource: existingUser.externalMetadata?.digitalIdentitySource,
        };
    }
}
