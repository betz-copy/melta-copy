import { IUserSearchBody } from '@packages/user';
import axios from 'axios';
import config from '../config';

const {
    userService: { url, usersRoute, requestTimeout },
} = config;

class UserService {
    private static userService = axios.create({
        baseURL: url,
        timeout: requestTimeout,
    });

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await UserService.userService.post<string[]>(`${usersRoute}/search-ids`, searchBody);
        return data;
    }
}

export default UserService;
