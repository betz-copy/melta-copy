import { Kartoffel } from '../../externalServices/kartoffel';
import { IKartoffelUser, IKartoffelUserDigitalIdentity } from '../../externalServices/kartoffel/interface';
import { UserService } from '../../externalServices/userService';
import { ICompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';
import { objectContains } from '../../utils';
import { DigitalIdentitySourceDoesNotExistsError } from './error';
import { IExternalUser, IExternalUserDigitalIdentity } from './interfaces';

export class UsersManager {
    static async getUserById(userId: string): Promise<IUser> {
        return UserService.getUserById(userId);
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

        kartoffelUser.digitalIdentities.forEach((kartoffelDigitalIdentity) => {
            digitalIdentities[kartoffelDigitalIdentity.source] = {
                fullName: kartoffelUser.fullName || `${kartoffelUser.firstName} ${kartoffelUser.lastName}`,
                hierarchy: kartoffelDigitalIdentity.role.hierarchy,
                jobTitle: kartoffelDigitalIdentity.role.jobTitle,
                mail: kartoffelDigitalIdentity.mail,
            };
        });

        return {
            kartoffelId: kartoffelUser.id,
            digitalIdentities,
        };
    }

    private static async getExternalUserDigitalIdentity(kartoffelId: string, digitalIdentitySource: string): Promise<IExternalUserDigitalIdentity> {
        const kartoffelUser = await Kartoffel.getUserById(kartoffelId);

        const kartoffelDigitalIdentity = kartoffelUser.digitalIdentities.find((digitalIdentity) => digitalIdentity.source === digitalIdentitySource);
        if (!kartoffelDigitalIdentity) throw new DigitalIdentitySourceDoesNotExistsError(digitalIdentitySource, kartoffelUser.id);

        return this.kartoffelUserDigitalIdentityToExternalUserDigitalIdentity(kartoffelDigitalIdentity, kartoffelUser);
    }

    private static kartoffelUserDigitalIdentityToExternalUserDigitalIdentity(
        digitalIdentity: IKartoffelUserDigitalIdentity,
        kartoffelUser: IKartoffelUser,
    ): IExternalUserDigitalIdentity {
        return {
            fullName: kartoffelUser.fullName || `${kartoffelUser.firstName} ${kartoffelUser.lastName}`,
            hierarchy: digitalIdentity.role.hierarchy,
            jobTitle: digitalIdentity.role.jobTitle,
            mail: digitalIdentity.mail,
        };
    }
}
