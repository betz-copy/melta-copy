import { Kartoffel } from '../../externalServices/kartoffel';
import { IKartoffelUser, IKartoffelUserDigitalIdentity } from '../../externalServices/kartoffel/interface';
import { UserService } from '../../externalServices/userService';
import { ICompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';
import { objectContains } from '../../utils';
import { DigitalIdentitySourceDoesNotExistsError, KartoffelUserMissingDataError } from './error';
import { IExternalUser, IExternalUserDigitalIdentity } from './interfaces';

export class UsersManager {
    static async getUserById(userId: string, workspaceIds?: string[]): Promise<IUser> {
        return UserService.getUserById(userId, workspaceIds);
    }

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchUserIds(searchBody);
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<IUser[]> {
        return UserService.searchUsers(searchBody);
    }

    static async createUser(kartoffelId: string, digitalIdentitySource: string, permissions: ICompactPermissions): Promise<IUser> {
        const digitalIdentity = await this.getExternalUserDigitalIdentity(kartoffelId, digitalIdentitySource);

        return UserService.createUser({ ...digitalIdentity, permissions, externalMetadata: { kartoffelId, digitalIdentitySource }, preferences: {} });
    }

    static async updateUserExternalMetadata(userId: string, externalMetadata: Partial<IBaseUser['externalMetadata']>): Promise<IUser> {
        return UserService.updateUser(userId, { externalMetadata });
    }

    static async syncUserPermissions(userId: string, permissions: ICompactPermissions): Promise<ICompactPermissions> {
        return UserService.syncUserPermissions(userId, permissions);
    }

    static async syncUser(userId: string): Promise<IUser> {
        const user = await UserService.getUserById(userId);

        const digitalIdentity = await this.getExternalUserDigitalIdentity(
            user.externalMetadata.kartoffelId,
            user.externalMetadata.digitalIdentitySource,
        );

        if (objectContains(user, digitalIdentity)) return user;

        return UserService.updateUser(userId, digitalIdentity);
    }

    static async searchExternalUsers(search: string): Promise<IExternalUser[]> {
        let kartoffelUsers: IKartoffelUser[];

        if (Kartoffel.isDomainUser(search)) {
            kartoffelUsers = [await Kartoffel.getUserByDigitalIdentity(search)];
        } else if (Kartoffel.isIdentifier(search)) {
            kartoffelUsers = [await Kartoffel.getUserByIdentifier(search)];
        } else if (Kartoffel.isKartoffelId(search)) {
            kartoffelUsers = [await Kartoffel.getUserById(search)];
        } else {
            kartoffelUsers = await Kartoffel.getUsersByName(search);
        }

        return Promise.all(kartoffelUsers.map((kartoffelUser) => this.kartoffelUserToExternalUserData(kartoffelUser)));
    }

    private static kartoffelUserToExternalUserData(kartoffelUser: IKartoffelUser): IExternalUser {
        const digitalIdentities: IExternalUser['digitalIdentities'] = {};

        if (!kartoffelUser.digitalIdentities) throw new KartoffelUserMissingDataError(kartoffelUser._id);

        let completedDigitalIdentities = 0;

        kartoffelUser.digitalIdentities.forEach((kartoffelDigitalIdentity) => {
            if (!kartoffelDigitalIdentity.source) return;

            try {
                digitalIdentities[kartoffelDigitalIdentity.source] = this.kartoffelUserDigitalIdentityToExternalUserDigitalIdentity(
                    kartoffelDigitalIdentity,
                    kartoffelUser,
                );
            } catch {
                return;
            }

            completedDigitalIdentities++;
        });

        if (!completedDigitalIdentities) throw new KartoffelUserMissingDataError(kartoffelUser._id);

        return {
            kartoffelId: kartoffelUser._id,
            digitalIdentities,
        };
    }

    private static async getExternalUserDigitalIdentity(kartoffelId: string, digitalIdentitySource: string): Promise<IExternalUserDigitalIdentity> {
        const kartoffelUser = await Kartoffel.getUserById(kartoffelId);

        const kartoffelDigitalIdentity = kartoffelUser.digitalIdentities?.find((digitalIdentity) => digitalIdentity.source === digitalIdentitySource);
        if (!kartoffelDigitalIdentity) throw new DigitalIdentitySourceDoesNotExistsError(digitalIdentitySource, kartoffelUser._id);

        return this.kartoffelUserDigitalIdentityToExternalUserDigitalIdentity(kartoffelDigitalIdentity, kartoffelUser);
    }

    private static kartoffelUserDigitalIdentityToExternalUserDigitalIdentity(
        digitalIdentity: IKartoffelUserDigitalIdentity,
        kartoffelUser: IKartoffelUser,
    ): IExternalUserDigitalIdentity {
        const fullName =
            kartoffelUser.fullName || (kartoffelUser.firstName && kartoffelUser.lastName)
                ? `${kartoffelUser.firstName} ${kartoffelUser.lastName}`
                : undefined;
        const hierarchy = digitalIdentity.role?.hierarchy || kartoffelUser.hierarchy;
        const jobTitle = digitalIdentity.role?.jobTitle || kartoffelUser.jobTitle;
        const mail = digitalIdentity.mail || kartoffelUser.mail;

        if (!fullName || !hierarchy || !jobTitle || !mail) {
            throw new KartoffelUserMissingDataError(kartoffelUser._id);
        }

        return {
            fullName,
            hierarchy,
            jobTitle,
            mail,
        };
    }
}
