import { UserService } from '../services/user';
import { IUserSearchBody } from '@microservices/shared/src/interfaces/user';

export class UsersManager {
    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        return UserService.searchUserIds(searchBody);
    }
}
