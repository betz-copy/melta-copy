import { FilterQuery } from 'mongoose';
import { IBaseUser, IUser, IUserSearchBody } from './interface';
import { UsersModel } from './model';
import { PermissionsManager } from '../permissions/manager';
import { typedObjectEntries } from '../../utils';

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

    static async updateUser(id: string, updateData: Partial<IBaseUser>) {
        return UsersModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();
    }

    static async updateUsersBulk(bulkUpdateData: Record<string, IBaseUser>) {
        await UsersModel.bulkWrite(
            typedObjectEntries(bulkUpdateData).map(([id, updateData]) => ({ updateOne: { filter: { _id: id }, update: updateData } })),
        );
    }
}
