import {
    IKartoffelUser,
    searchUsersByName,
    getEntityById,
    getUserByDigitalIdentity,
    getUserByIdentifier,
    isKartoffelId,
    getUserById,
    wrapKartoffelRequestForUiSearch,
    isDomainUser,
    isIdentifier,
} from '../../externalServices/kartoffelApi';
import { IUser } from './interface';

export class UsersManager {
    private static getFormattedDisplayName(fullName: string, hierarchy?: string, jobTitle?: string) {
        let displayName: string = fullName;
        if (hierarchy && jobTitle) {
            displayName += `- ${hierarchy}/${jobTitle}`;
        } else if (hierarchy) {
            displayName += `- ${hierarchy}`;
        } else if (jobTitle) {
            displayName += `- ${jobTitle}`;
        }

        return displayName;
    }

    static kartoffelUserToUser(kartoffelUser: IKartoffelUser): IUser {
        const { id, fullName, hierarchy, jobTitle, digitalIdentities, firstName, lastName } = kartoffelUser;

        const displayName = UsersManager.getFormattedDisplayName(fullName, hierarchy, jobTitle);

        return { id, displayName, firstName, lastName, fullName, digitalIdentities: digitalIdentities.map(({ uniqueId }) => ({ uniqueId })) };
    }

    static async getUserById(id: string) {
        const kartoffelUser = await getEntityById(id);

        return UsersManager.kartoffelUserToUser(kartoffelUser);
    }

    static async searchUsers(search: string) {
        if (isDomainUser(search)) {
            const kartoffelUsers = await wrapKartoffelRequestForUiSearch(() => getUserByDigitalIdentity(search));
            return kartoffelUsers.map(UsersManager.kartoffelUserToUser);
        }

        if (isIdentifier(search)) {
            const kartoffelUsers = await wrapKartoffelRequestForUiSearch(() => getUserByIdentifier(search));
            return kartoffelUsers.map(UsersManager.kartoffelUserToUser);
        }

        if (isKartoffelId(search)) {
            const kartoffelUsers = await wrapKartoffelRequestForUiSearch(() => getUserById(search));
            return kartoffelUsers.map(UsersManager.kartoffelUserToUser);
        }

        const kartoffelUsers = await searchUsersByName(search);
        return kartoffelUsers.map(UsersManager.kartoffelUserToUser);
    }
}

export default UsersManager;
