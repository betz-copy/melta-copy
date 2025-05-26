/* eslint-disable no-param-reassign */
import { FilterQuery } from 'mongoose';
import { ISubCompactPermissions, IBaseUser, IUser, IUserAgGridRequest } from '@microservices/shared';
import UsersModel from './model';
import PermissionsManager from '../permissions/manager';
import { typedObjectEntries } from '../../utils';
import { UserDoesNotExistError } from './errors';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { displayName, permissionsManagement, templatesManagement, rulesManagement, processesManagement, ...query }: FilterQuery<IBaseUser> = {},
        { displayName: displayNameSort }: Record<string, number> = {},
    ): Promise<{ users: IBaseUser[]; count: number }> {
        const sort: FilterQuery<IBaseUser> = {};
        if (displayName) query.$or = [{ fullName: displayName.$regex }, { jobTitle: displayName.$regex }, { hierarchy: displayName.$regex }];

        if (search) {
            const searchRegex = { $regex: new RegExp(search, 'i') };
            const searchQuery = [
                { fullName: searchRegex },
                { jobTitle: searchRegex },
                { hierarchy: searchRegex },
                { mail: searchRegex },
                { 'externalMetadata.kartoffelId': searchRegex },
            ];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchQuery }];
                delete query.$or;
            } else query.$or = searchQuery;
        }

        if (displayNameSort) sort.fullName = displayNameSort;

        if (permissions || workspaceIds) {
            const simplePermissions = await PermissionsManager.searchBySubCompactPermissions(permissions ?? {}, workspaceIds);
            const usersIds = new Set<string>(simplePermissions.map(({ userId }) => userId));
            query._id = { $in: [...usersIds] };
        }

        const users = await UsersModel.find(query, {}, { limit, skip: step * limit, sort })
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

    static async searchUsers(request: IUserAgGridRequest): Promise<{ users: IUser[]; count: number }> {
        const { limit, step, workspaceIds, permissions, filterModel, sortModel, search } = request;

        const sort = sortModel ? translateAgGridSortModel(sortModel) : {};
        const query = filterModel ? translateAgGridFilterModel(filterModel) : {};

        const { users, count } = await this.searchBaseUsers(search, permissions, workspaceIds, limit, step, query, sort);
        const permissionsToUsers = await this.appendPermissionsToUsers(users);

        return { users: permissionsToUsers, count };
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

    static async searchUsersByPermissions(workspaceId: string, search?: string, pagination?: { step: number; limit: number }): Promise<IUser[]> {
        const permissions = await PermissionsManager.getPermissionsByWorkspaceId(workspaceId, pagination);

        const query: FilterQuery<IUser> = {};

        query._id = { $in: permissions.map(({ userId }) => userId) };

        if (search) {
            const searchRegex = { $regex: new RegExp(search, 'i') };
            const searchQuery = [
                { fullName: searchRegex },
                { jobTitle: searchRegex },
                { hierarchy: searchRegex },
                { mail: searchRegex },
                { 'externalMetadata.kartoffelId': searchRegex },
            ];

            query.$or = searchQuery;
        }

        const users = await UsersModel.find(query)
            .lean()
            .exec();

        return this.appendPermissionsToUsers(users);
    }

    static async searchUsersByPermWithCount(workspaceId: string, limit: number, step: number): Promise<{ users: IUser[]; count: number }> {
        const { permissions, count } = await PermissionsManager.getPermissionsByWorkspaceIdWithCount(workspaceId, limit, step);

        const users = await Promise.all(permissions.map(({ userId }) => this.getUserById(userId)));

        return { users, count };
    }
}

export default UsersManager;
