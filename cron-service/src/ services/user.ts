import axios from 'axios';
import config from '../config';
import { IUserSearchBody } from '../users/intefaces/users';

const {
    userService: { url, usersRoute, requestTimeout },
} = config;

export class UserService {
    private static userService = axios.create({
        baseURL: url,
        timeout: requestTimeout,
    });

    static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
        const { data } = await this.userService.post<string[]>(`${usersRoute}/search-ids`, searchBody);
        return data;
    }
}
