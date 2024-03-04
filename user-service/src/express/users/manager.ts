import { FilterQuery } from 'mongoose';
import { IBaseUser, IUser, IUserSearchBody } from './interface';
import { UsersModel } from './model';
import { PermissionsManager } from '../permissions/manager';
import { typedObjectEntries } from '../../utils';
import { UserDoesNotExistError } from './errors';
import { ICompactPermissions } from '../permissions/interface/permissions';

export class UsersManager {
    static async getUserById(id: string): Promise<IUser> {
        const baseUser = await UsersModel.findById(id).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.appendPermissionsToUser(baseUser);
    }

    static async searchUsers(search: string, permissions: ICompactPermissions, limit: number, step: number): Promise<IUser[]> {
        const query: FilterQuery<IBaseUser> = {};

        if (search) {
            const searchRegex = { $regex: new RegExp(search, 'i') };

            query.$or = [
                { fullName: searchRegex },
                { jobTitle: searchRegex },
                { hierarchy: searchRegex },
                { mail: searchRegex },
                { 'externalMetadata.kartoffelId': searchRegex },
            ];
        }

        if (permissions) {
            const simplePermissions = await PermissionsManager.searchByCompactPermissions(permissions);

            query.$in = simplePermissions.map(({ userId }) => userId);
        }

        const baseUsers = await UsersModel.find(query, { limit, skip: step * limit })
            .lean()
            .exec();

        return this.appendPermissionsToUsers(baseUsers);
    }

    static async createUser({ permissions, ...userData }: Omit<IUser, '_id'>): Promise<IUser> {
        const baseUser = (await UsersModel.create(userData)).toObject();

        await PermissionsManager.syncCompactPermissionsOfUser(baseUser._id, permissions);

        return this.appendPermissionsToUser(baseUser);
    }

    static async updateUser(id: string, updateData: Partial<IBaseUser>): Promise<IUser> {
        const baseUser = await UsersModel.findByIdAndUpdate(id, updateData, { new: true }).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.appendPermissionsToUser(baseUser);
    }

    static async updateUsersBulk(bulkUpdateData: Record<string, IBaseUser>): Promise<void> {
        await UsersModel.bulkWrite(
            typedObjectEntries(bulkUpdateData).map(([id, updateData]) => ({ updateOne: { filter: { _id: id }, update: updateData } })),
        );
    }

    private static async appendPermissionsToUser(user: IBaseUser): Promise<IUser> {
        const permissions = await PermissionsManager.getCompactPermissionsOfUser(user._id);
        return { ...user, permissions };
    }

    private static async appendPermissionsToUsers(users: IBaseUser[]): Promise<IUser[]> {
        return Promise.all(users.map((user) => this.appendPermissionsToUser(user)));
    }
}
