import { FilterQuery } from 'mongoose';
import { IBaseUser, IUser } from './interface';
import { UsersModel } from './model';
import { PermissionsManager } from '../permissions/manager';
import { typedObjectEntries } from '../../utils';
import { UserDoesNotExistError } from './errors';
import { ISubCompactPermissions } from '../permissions/interface/permissions';

export class UsersManager {
    static async getUserById(id: string, workspaceIds?: string[]): Promise<IUser> {
        console.log('1');

        const baseUser = await UsersModel.findById(id).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.baseUserToUser(baseUser, workspaceIds);
    }

    static async getUserByExternalId(id: string, workspaceIds?: string[]): Promise<IUser> {
        console.log('2');
        
        const baseUser = await UsersModel.findOne({ 'externalMetadata.kartoffelId': id }).orFail(new UserDoesNotExistError(id)).lean().exec();
        return this.baseUserToUser(baseUser, workspaceIds);
    }

    static async searchBaseUsers(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceId: string | undefined,
        limit: number,
        step: number,
    ): Promise<IBaseUser[]> {
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

        if (permissions || workspaceId) {
            const simplePermissions = await PermissionsManager.searchBySubCompactPermissions(permissions ?? {}, workspaceId);
            const usersIds = new Set<string>(simplePermissions.map(({ userId }) => userId));
            query._id = { $in: [...usersIds] };
        }

        const baseUsers = await UsersModel.find(query, {}, { limit, skip: step * limit })
            .lean()
            .exec();

        return baseUsers;
    }

    static async searchUserIds(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceId: string | undefined,
        limit: number,
        step: number,
    ): Promise<string[]> {
        const baseUsers = await this.searchBaseUsers(search, permissions, workspaceId, limit, step);
        return baseUsers.map(({ _id }) => _id);
    }

    static async searchUsers(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceId: string | undefined,
        limit: number,
        step: number,
    ): Promise<IUser[]> {
        const baseUsers = await this.searchBaseUsers(search, permissions, workspaceId, limit, step);
        return this.appendPermissionsToUsers(baseUsers);
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
