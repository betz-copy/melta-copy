import { IKartoffelUser, searchKartoffelUsers, getEntityById } from '../../externalServices/kartoffel';
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

    static async searchUsers(fullName: string) {
        const kartoffelUsers = await searchKartoffelUsers(fullName);
        return kartoffelUsers.map(UsersManager.kartoffelUserToUser);
    }
}

export default UsersManager;
