import { FilterQuery } from 'mongoose';
import { ISubCompactPermissions, IBaseUser, IUser } from '@microservices/shared';
import UsersModel from './model';
import PermissionsManager from '../permissions/manager';
import { typedObjectEntries } from '../../utils';
import { UserDoesNotExistError } from './errors';

class UsersManager {
    static async getUserById(id: string, workspaceIds?: string[]): Promise<IUser> {
        const baseUser = await UsersModel.findById(id).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.baseUserToUser(baseUser, workspaceIds);
    }

    static async getUserByExternalId(id: string, workspaceIds?: string[]): Promise<IUser> {
        const baseUser = await UsersModel.findOne({ 'externalMetadata.kartoffelId': id }).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.baseUserToUser(baseUser, workspaceIds);
    }

    static async searchBaseUsers(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
    ): Promise<{ users: IBaseUser[]; count: number }> {
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

        if (permissions || workspaceIds) {
            const simplePermissions = await PermissionsManager.searchBySubCompactPermissions(permissions ?? {}, workspaceIds);
            const usersIds = new Set<string>(simplePermissions.map(({ userId }) => userId));
            query._id = { $in: [...usersIds] };
        }

        const users = await UsersModel.find(query, {}, { limit, skip: step * limit })
            .lean()
            .exec();

        const count = await UsersModel.countDocuments(query);

        return { users, count };
    }

    static async searchUserIds(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
    ): Promise<string[]> {
        const { users } = await this.searchBaseUsers(search, permissions, workspaceIds, limit, step);
        return users.map(({ _id }) => _id);
    }

    static async searchUsers(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
    ): Promise<{ users: IUser[]; count: number }> {
        const { users, count } = await this.searchBaseUsers(search, permissions, workspaceIds, limit, step);
        return { users: await this.appendPermissionsToUsers(users), count };
    }

    static async createUser({ permissions, ...userData }: Omit<IUser, '_id'>): Promise<IUser> {
        const baseUser = (await UsersModel.create(userData)).toObject();

        await PermissionsManager.syncCompactPermissionsOfUser(baseUser._id, permissions);

        return this.baseUserToUser(baseUser);
    }

    static async updateUser(id: string, updateData: Partial<IBaseUser>): Promise<IUser> {
        const baseUser = await UsersModel.findByIdAndUpdate(id, updateData, { new: true }).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.baseUserToUser(baseUser);
    }

    static async updateUsersBulk(bulkUpdateData: Record<string, IBaseUser>): Promise<void> {
        await UsersModel.bulkWrite(
            typedObjectEntries(bulkUpdateData).map(([id, updateData]) => ({ updateOne: { filter: { _id: id }, update: updateData } })),
        );
    }

    private static async baseUserToUser(user: IBaseUser, workspaceIds?: string[]): Promise<IUser> {
        const permissions = await PermissionsManager.getCompactPermissionsOfUser(user._id, workspaceIds);
        return { ...user, permissions, displayName: `${user.fullName} - ${user.hierarchy}/${user.jobTitle}` };
    }

    private static async appendPermissionsToUsers(users: IBaseUser[]): Promise<IUser[]> {
        return Promise.all(users.map((user) => this.baseUserToUser(user)));
    }
}

export default UsersManager;
