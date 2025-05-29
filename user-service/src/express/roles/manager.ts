/* eslint-disable no-param-reassign */
import { FilterQuery } from 'mongoose';
import {
    ISubCompactPermissions,
    IRole,
    IUserAgGridRequest,
    IBaseRole,
    RelatedPermission,
    NotFoundError,
    ValidationError,
} from '@microservices/shared';
import RolesModel from './model';
import PermissionsManager from '../permissions/manager';
import { typedObjectEntries } from '../../utils';
import { RoleDoesNotExistError } from './errors';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';

class RolesManager {
    static async getRoleById(id: string, workspaceIds?: string[]): Promise<IRole> {
        const baseRole = await RolesModel.findById(id).orFail(new RoleDoesNotExistError(id)).lean().exec();
        return this.baseRoleToRole(baseRole, workspaceIds);
    }

    static async getRolesByIds(ids: string[], workspaceIds?: string[]): Promise<IRole[]> {
        const baseRoles = await RolesModel.find({ _id: { $in: ids } })
            .lean()
            .exec();

        if (baseRoles.length !== ids.length) {
            const foundIds = baseRoles.map((role) => role._id.toString());
            const missingIds = ids.filter((id) => !foundIds.includes(id));
            throw new RoleDoesNotExistError(`Missing roles with IDs: ${missingIds.join(', ')}`);
        }

        return Promise.all(baseRoles.map((baseRole) => this.baseRoleToRole(baseRole, workspaceIds)));
    }

    static async searchBaseRoles(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { name, permissionsManagement, templatesManagement, rulesManagement, processesManagement, ...query }: FilterQuery<IBaseRole> = {},
        { name: nameSort }: Record<string, number> = {},
    ): Promise<{ roles: IBaseRole[]; count: number }> {
        const sort: FilterQuery<IBaseRole> = {};
        if (name) query.$or = [{ name: name.$regex }];

        if (search) {
            const searchRegex = { $regex: new RegExp(search, 'i') };
            const searchQuery = [{ name: searchRegex }];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchQuery }];
                delete query.$or;
            } else query.$or = searchQuery;
        }

        if (nameSort) sort.name = nameSort;

        if (permissions || workspaceIds) {
            const simplePermissions = await PermissionsManager.searchBySubCompactPermissions(permissions ?? {}, workspaceIds);
            const roleIds = new Set<string>(simplePermissions.map(({ relatedId }) => relatedId));
            query._id = { $in: [...roleIds] };
        }

        const roles = await RolesModel.find(query, {}, { limit, skip: step * limit, sort })
            .lean()
            .exec();

        const count = await RolesModel.countDocuments(query);

        return { roles, count };
    }

    static async searchRoleIds(
        search: string | undefined,
        permissions: ISubCompactPermissions | undefined,
        workspaceIds: string[] | undefined,
        limit: number,
        step: number,
    ): Promise<string[]> {
        const { roles } = await this.searchBaseRoles(search, permissions, workspaceIds, limit, step);
        return roles.map(({ _id }) => _id);
    }

    static async searchRoles(request: IUserAgGridRequest): Promise<{ roles: IRole[]; count: number }> {
        const { limit, step, workspaceIds, permissions, filterModel, sortModel, search } = request;

        const sort = sortModel ? translateAgGridSortModel(sortModel) : {};
        const query = filterModel ? translateAgGridFilterModel(filterModel) : {};

        const { roles, count } = await this.searchBaseRoles(search, permissions, workspaceIds, limit, step, query, sort);
        const permissionsToRoles = await this.appendPermissionsToRoles(roles);

        return { roles: permissionsToRoles, count };
    }

    static async getAllWorkspaceRoles(workspaceIds: string[]): Promise<IRole[]> {
        const permissions = await PermissionsManager.searchBySubCompactPermissions({}, workspaceIds);
        const roleIds = [...new Set(permissions.map(({ relatedId }) => relatedId))];

        const roles = await RolesModel.find({ _id: { $in: roleIds } }).lean();
        const permissionsToRoles = await this.appendPermissionsToRoles(roles);

        return permissionsToRoles;
    }

    static async getUserRolePerWorkspace(roleIds: string[], workspaceId: string) {
        const workspaceRoles = await this.getAllWorkspaceRoles([workspaceId]);

        return workspaceRoles.find((role) => roleIds.includes(role._id.toString()));
    }

    static async createRole({ permissions, ...roleData }: Omit<IRole, '_id'>): Promise<IRole> {
        const workspaceIds = Object.keys(permissions);
        const workspaceRoles = await this.getAllWorkspaceRoles(workspaceIds);
        if (workspaceRoles.find((workspaceRole) => workspaceRole.name === roleData.name)) throw new ValidationError('role name needs to be unique');
        const baseRole = (await RolesModel.create(roleData)).toObject();

        await PermissionsManager.syncCompactPermissions(baseRole._id, RelatedPermission.Role, permissions);

        return this.baseRoleToRole(baseRole);
    }

    static async updateRole(id: string, updateData: Partial<IBaseRole>): Promise<IRole> {
        const baseRole = await RolesModel.findByIdAndUpdate(id, updateData, { new: true }).orFail(new RoleDoesNotExistError(id)).lean().exec();
        return this.baseRoleToRole(baseRole);
    }

    static async updateRolesBulk(bulkUpdateData: Record<string, IBaseRole>): Promise<void> {
        await RolesModel.bulkWrite(
            typedObjectEntries(bulkUpdateData).map(([id, updateData]) => ({ updateOne: { filter: { _id: id }, update: updateData } })),
        );
    }

    private static async baseRoleToRole(role: IBaseRole, workspaceIds?: string[]): Promise<IRole> {
        const permissions = await PermissionsManager.getCompactPermissionsOfRelatedId(role._id, workspaceIds, RelatedPermission.Role);
        return { ...role, permissions };
    }

    private static async appendPermissionsToRoles(roles: IBaseRole[]): Promise<IRole[]> {
        return Promise.all(roles.map((role) => this.baseRoleToRole(role)));
    }

    static async searchRolesByPermissions(workspaceId: string, pagination?: { step: number; limit: number }): Promise<IRole[]> {
        const permissions = await PermissionsManager.getPermissionsByWorkspaceId(workspaceId, pagination);

        const roles = await RolesModel.find({ _id: { $in: permissions.map(({ relatedId }) => relatedId) } })
            .lean()
            .exec();

        return this.appendPermissionsToRoles(roles);
    }

    static async deleteRoleById(roleId: string) {
        return RolesModel.findByIdAndDelete(roleId).orFail(new NotFoundError('Role not found'));
    }

    static async searchRolesByPermWithCount(workspaceId: string, limit: number, step: number): Promise<{ roles: IRole[]; count: number }> {
        const { permissions, count } = await PermissionsManager.getPermissionsByWorkspaceIdWithCount(workspaceId, limit, step);

        const roles = await Promise.all(permissions.map(({ relatedId }) => this.getRoleById(relatedId)));

        return { roles, count };
    }
}

export default RolesManager;
