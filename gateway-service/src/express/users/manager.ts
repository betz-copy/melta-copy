import { UserService } from '../../externalServices/userService';
import { ICompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IBaseUser, IUserSearchBody } from '../../externalServices/userService/interfaces/users';

export class UsersManager {
    static async getUserById(userId: string) {
        return UserService.getUserById(userId);
    }

    static async searchUsers(searchBody: IUserSearchBody) {
        return UserService.searchUsers(searchBody);
    }

    static async updateUserExternalMetadata(userId: string, externalMetadata: Partial<IBaseUser['externalMetadata']>) {
        return UserService.updateUser(userId, { externalMetadata });
    }

    static async syncUser(userId: string) {
        // TODO
    }

    static async syncUserPermissions(userId: string, permissions: ICompactPermissions) {
        return UserService.syncUserPermissions(userId, permissions);
    }
}
