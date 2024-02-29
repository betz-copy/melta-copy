import { FilterQuery } from 'mongoose';
import { IBaseUser, IUser, IUserSearchBody } from './interface';
import { UsersModel } from './model';
import { PermissionsManager } from '../permissions/manager';

export class UsersManager {
    static async getUserById(id: string) {
        return UsersModel.findById(id).lean().exec();
    }

    static async searchUsers(filter: IUserSearchBody) {
        const { permissions, ...restOfFilter } = filter;

        const query: FilterQuery<IBaseUser> = restOfFilter;

        if (permissions) {
            const simplePermissions = await PermissionsManager.searchByCompactPermissions(permissions);

            query.$in = simplePermissions.map(({ userId }) => userId);
        }

        return UsersModel.find(query).lean().exec();
    }

    static async createUser({ permissions, ...baseUser }: Omit<IUser, '_id'>) {
        const newUser = await UsersModel.create(baseUser);

        await PermissionsManager.syncCompactPermissionsOfUser(newUser._id, permissions);

        return newUser;
    }
}
