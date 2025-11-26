/* eslint-disable no-param-reassign */

import { IBaseUser, IRole, ISubCompactPermissions, IUser, IUserAgGridRequest, IUserPopulated, RelatedPermission } from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import { typedObjectEntries } from '../../utils';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import PermissionsManager from '../permissions/manager';
import RolesManager from '../roles/manager';
import { UserDoesNotExistError } from './errors';
import UsersModel from './model';

class UsersManager {
    static async getUserById(id: string, workspaceIds?: string[], withPermissions: boolean = true): Promise<IUser | Partial<IUser>> {
        const baseUser = await UsersModel.findById(id).orFail(new UserDoesNotExistError(id)).lean().exec();
        return withPermissions ? UsersManager.baseUserToUser(baseUser, workspaceIds) : baseUser;
    }

    static async getUserByExternalId(id: string, workspaceIds?: string[]): Promise<IUser> {
        const baseUser = await UsersModel.findOne({ kartoffelId: id }).orFail(new UserDoesNotExistError(id)).lean().exec();
        return UsersManager.baseUserToUser(baseUser, workspaceIds);
    }

    static async searchBaseUsers(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
        ids?: string[],
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
                { kartoffelId: searchRegex },
            ];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchQuery }];
                delete query.$or;
            } else query.$or = searchQuery;
        }

        if (displayNameSort) sort.fullName = displayNameSort;

        if (permissions || workspaceIds) {
            const simplePermissions = await PermissionsManager.searchBySubCompactPermissions(permissions ?? {}, workspaceIds);
            const relatedIds = new Set<string>(simplePermissions.map(({ relatedId }) => relatedId));
            const searchByRelatedIds = [{ _id: { $in: [...relatedIds] } }, { roleIds: { $in: [...relatedIds] } }];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchByRelatedIds }];
                delete query.$or;
            } else query.$or = searchByRelatedIds;
        }

        if (ids?.length) {
            const idsQuery = [{ _id: { $in: ids } }];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: idsQuery }];
                delete query.$or;
            } else query.$or = idsQuery;
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
        ids?: string[],
    ): Promise<string[]> {
        const { users } = await UsersManager.searchBaseUsers(search, permissions, workspaceIds, limit, step, ids);
        return users.map(({ _id }) => _id);
    }

    static async searchUsers(request: IUserAgGridRequest): Promise<{ users: IUserPopulated[]; count: number }> {
        const { limit, step, workspaceIds, permissions, filterModel, sortModel, search, ids } = request;

        const sort = sortModel ? translateAgGridSortModel(sortModel) : {};
        const query = filterModel ? translateAgGridFilterModel(filterModel) : {};

        const { users, count } = await UsersManager.searchBaseUsers(search, permissions, workspaceIds, limit, step, ids, query, sort);
        const permissionsToUsers = await UsersManager.appendPermissionsToUsers(users, true);

        return { users: permissionsToUsers, count };
    }

    static async createUser({ permissions, ...userData }: Omit<IUser, '_id'>): Promise<IUser> {
        const baseUser = (await UsersModel.create(userData)).toObject();

        if (userData.roleIds && userData.roleIds?.length > 0)
            await RolesManager.getRoleById(userData.roleIds[0]); // Validate role exists
        else await PermissionsManager.syncCompactPermissions(baseUser._id, RelatedPermission.User, permissions);

        return UsersManager.baseUserToUser(baseUser);
    }

    static async updateUser(id: string, updateData: Partial<IBaseUser>): Promise<IUser> {
        const updateQuery: any = { ...updateData };

        if (updateQuery.roleIds === null) {
            delete updateQuery.roleIds; // remove from $set
            updateQuery.$unset = { roleIds: '' };
        }

        const baseUser = await UsersModel.findByIdAndUpdate(id, updateQuery, { new: true }).orFail(new UserDoesNotExistError(id)).lean().exec();

        return UsersManager.baseUserToUser(baseUser);
    }

    static async updateUsersBulk(bulkUpdateData: Record<string, IBaseUser>): Promise<void> {
        await UsersModel.bulkWrite(
            typedObjectEntries(bulkUpdateData).map(([id, updateData]) => ({ updateOne: { filter: { _id: id }, update: updateData } })),
        );
    }

    private static async baseUserToUser(user: IBaseUser, workspaceIds?: string[], populated?: boolean): Promise<IUser | IUserPopulated> {
        const { roleIds, ...userWithoutRole } = user;

        const permissions = await PermissionsManager.getCompactPermissionsOfRelatedId(user._id, workspaceIds);

        let roles: string[] | IRole[] | undefined = roleIds;
        if (populated && roleIds && roleIds?.length > 0) roles = await RolesManager.getRolesByIds(roleIds);

        return {
            ...userWithoutRole,
            [populated ? 'roles' : 'roleIds']: roles,
            permissions,
            displayName: `${user.fullName} - ${user.hierarchy}/${user.jobTitle}`,
        };
    }

    private static async appendPermissionsToUsers(users: IBaseUser[], populated?: boolean): Promise<IUser[] | IUserPopulated[]> {
        return Promise.all(users.map((user) => UsersManager.baseUserToUser(user, undefined, populated)));
    }

    static async searchUsersByPermissions(workspaceId: string, search?: string, pagination?: { step: number; limit: number }): Promise<IUser[]> {
        const permissions = await PermissionsManager.getPermissionsByWorkspaceId(workspaceId, pagination);

        const query: FilterQuery<IUser> = {};

        query._id = { $in: permissions.map(({ relatedId }) => relatedId) };

        if (search) {
            const searchRegex = { $regex: new RegExp(search, 'i') };
            const searchQuery = [
                { fullName: searchRegex },
                { jobTitle: searchRegex },
                { hierarchy: searchRegex },
                { mail: searchRegex },
                { kartoffelId: searchRegex },
            ];

            query.$or = searchQuery;
        }

        const users = await UsersModel.find(query).lean().exec();

        return UsersManager.appendPermissionsToUsers(users);
    }

    static async deleteUserById(userId: string) {
        return UsersModel.findByIdAndDelete(userId).orFail(new UserDoesNotExistError(userId));
    }

    static async searchUsersByPermWithCount(workspaceId: string, limit: number, step: number): Promise<{ users: IUser[]; count: number }> {
        const { permissions, count } = await PermissionsManager.getPermissionsByWorkspaceIdWithCount(workspaceId, limit, step);

        const users = await Promise.all(permissions.map(({ relatedId }) => UsersManager.getUserById(relatedId)));

        return { users: users as IUser[], count };
    }

    static async getUsersConnectedToRole(roleId: string) {
        return UsersModel.find({ roleIds: { $in: [roleId] } })
            .lean()
            .exec();
    }
}

export default UsersManager;
