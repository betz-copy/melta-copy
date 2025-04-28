import { IUserSearchBody } from '@microservices/shared';
import UserService from '../services/user';

class UsersManager {
    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchUserIds(searchBody);
    }
}

export default UsersManager;
