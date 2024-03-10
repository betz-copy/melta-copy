import { Kartoffel } from '../../externalServices/kartoffel';
import { IKartoffelUser } from '../../externalServices/kartoffel/interface';
import { UserService } from '../../externalServices/userService';
import { ICompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';
import { IExternalUserData } from './interfaces';

export class UsersManager {
    static async getUserById(userId: string): Promise<IUser> {
        return UserService.getUserById(userId);
    }

    static async searchUsers(searchBody: IUserSearchBody): Promise<IUser[]> {
        return UserService.searchUsers(searchBody);
    }

    static async updateUserExternalMetadata(userId: string, externalMetadata: Partial<IBaseUser['externalMetadata']>) {
        return UserService.updateUser(userId, { externalMetadata });
    }

    static async syncUserPermissions(userId: string, permissions: ICompactPermissions): Promise<ICompactPermissions> {
        return UserService.syncUserPermissions(userId, permissions);
    }
    static async searchExternalUsers(search: string): Promise<IExternalUserData[]> {
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

    private static async kartoffelUserToExternalUserData(kartoffelUser: IKartoffelUser): Promise<IExternalUserData> {
        const digitalIdentities: IExternalUserData['digitalIdentities'] = {};

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
}
