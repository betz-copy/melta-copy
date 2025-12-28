import {
    ICompactNullablePermissions,
    ICompactPermissions,
    IPermission,
    ISubCompactPermissions,
    IUser,
    IUserPopulated,
    PermissionScope,
    PermissionType,
    RecursiveNullable,
    RelatedPermission,
    ValidationError,
} from '@microservices/shared';
import { mapValues } from 'lodash';
import { FilterQuery } from 'mongoose';
import { flattenObject, typedObjectEntries } from '../../utils';
import { transaction } from '../../utils/mongoose';
import RolesManager from '../roles/manager';
import UsersManager from '../users/manager';
import { SinglePermissionOfTypePerUserError } from './errors';
import PermissionsModel from './model';

class PermissionsManager {
    static async getCompactPermissions(permissions: IPermission[]): Promise<ICompactPermissions> {
        const compactPermissions: ICompactPermissions = {};

        permissions.forEach(({ workspaceId, type, metadata }) => {
            if (compactPermissions[workspaceId]?.[type]) throw new SinglePermissionOfTypePerUserError(type);

            if (!compactPermissions[workspaceId]) compactPermissions[workspaceId] = {};
            compactPermissions[workspaceId][type] = metadata as any;
        });

        return compactPermissions;
    }

    static async populateUserRoles(user: IUser): Promise<IUserPopulated> {
        const { roleIds, ...restOfUser } = user;
        return { ...restOfUser, roles: await RolesManager.getRolesByIds(roleIds ?? []) };
    }

    static async getCompactPermissionsOfRelatedId(
        relatedId: string,
        workspaceIds?: string[],
        permissionType: RelatedPermission = RelatedPermission.User,
    ): Promise<ICompactPermissions> {
        const query: FilterQuery<IPermission> = {};

        if (permissionType === RelatedPermission.User) {
            const user = await UsersManager.getUserById(relatedId, workspaceIds, false);
            query.relatedId = { $in: user.roleIds && user.roleIds.length > 0 ? [...user.roleIds, relatedId] : [relatedId] };
        } else query.relatedId = relatedId;

        if (workspaceIds) query.workspaceId = { $in: workspaceIds };

        const permissions = await PermissionsModel.find(query).lean().exec();
        return PermissionsManager.getCompactPermissions(permissions);
    }

    static async syncCompactPermissions(
        relatedId: string,
        permissionType: RelatedPermission,
        permissionsCompact: ICompactNullablePermissions | ICompactPermissions,
        dontDeleteUser?: boolean,
    ): Promise<ICompactPermissions> {
        const isDeletePermission =
            Object.values(permissionsCompact).every(
                (permission) =>
                    permission === null ||
                    (permission.permissions === null &&
                        permission.rules === null &&
                        permission.instances === null &&
                        permission.processes === null &&
                        permission.templates === null &&
                        permission.units === null),
            ) && !dontDeleteUser;

        if (permissionType === RelatedPermission.User)
            await UsersManager.getUserById(relatedId); // Validate user exists
        else {
            await RolesManager.getRoleById(relatedId); // Validate role exists
            if (isDeletePermission && (await UsersManager.getUsersConnectedToRole(relatedId)).length > 0)
                throw new ValidationError(`can't remove role if there is users connected`, { code: `can't remove role: user connected` });
        }

        const updatedWorkspacesIds: string[] = [];

        await transaction(async (session) => {
            const actions: Promise<any>[] = [];

            typedObjectEntries(permissionsCompact).forEach(([workspaceId, subCompactPermission]) => {
                if (subCompactPermission === null) {
                    actions.push(PermissionsModel.deleteMany({ relatedId, workspaceId }, { session }).lean().exec());
                    return;
                }

                updatedWorkspacesIds.push(workspaceId);

                typedObjectEntries(subCompactPermission).forEach(([type, metadata]) => {
                    if (metadata === null) {
                        actions.push(PermissionsModel.deleteOne({ relatedId, type, workspaceId }, { session }).lean().exec());
                        return;
                    }

                    actions.push(PermissionsModel.updateOne({ relatedId, type, workspaceId }, { metadata }, { upsert: true, session }).lean().exec());
                });
            });

            await Promise.all(actions);
        });

        const allRelatedPermissions = await PermissionsManager.getCompactPermissionsOfRelatedId(relatedId, undefined, permissionType);
        if (Object.keys(allRelatedPermissions).length === 0 && isDeletePermission) {
            // no permissions of role or user and it can be deleted from collection
            if (permissionType === RelatedPermission.Role) RolesManager.deleteRoleById(relatedId);
            else {
                const user = await UsersManager.getUserById(relatedId);
                if (user.roleIds?.length === 0) UsersManager.deleteUserById(relatedId);
            }
        }

        return Object.fromEntries(Object.entries(allRelatedPermissions).filter(([key]) => updatedWorkspacesIds.includes(key)));
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { relatedId?: IPermission['relatedId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ): Promise<void> {
        await PermissionsModel.updateMany(query, { $unset: flattenObject(metadata[query.type]!, ['metadata']) })
            .lean()
            .exec();
    }

    static async searchBySubCompactPermissions(subCompactPermissions: ISubCompactPermissions, workspaceIds?: string[]): Promise<IPermission[]> {
        const workspaceId = workspaceIds ? workspaceIds[workspaceIds.length - 1] : undefined;

        const query: FilterQuery<IPermission> = Object.keys(subCompactPermissions).length ? {} : { workspaceId };
        const subQueries: FilterQuery<IPermission>[] = [];

        typedObjectEntries(subCompactPermissions).forEach(([type, metadata]) => {
            const flattenMetadata = flattenObject(metadata!, ['metadata']);

            const flattenMetadataFixed = mapValues(flattenMetadata, (value, key) => {
                if (key.endsWith('scope') && value === PermissionScope.read) return [PermissionScope.read, PermissionScope.write];

                return value;
            });

            subQueries.push({ type, workspaceId, ...flattenMetadataFixed });
        });

        if (workspaceIds && workspaceIds.length > 1) {
            workspaceIds.pop();

            workspaceIds.forEach((innerWorkspaceId) => {
                subQueries.push({ type: PermissionType.admin, metadata: { scope: PermissionScope.write }, workspaceId: innerWorkspaceId });
            });
        }
        if (subQueries.length) query.$or = subQueries;

        return PermissionsModel.find(query).lean().exec();
    }

    static async getPermissionsByWorkspaceId(workspaceId: string, pagination?: { step: number; limit: number }): Promise<IPermission[]> {
        return PermissionsModel.find({ workspaceId }, pagination ? { limit: pagination.limit, skip: pagination.step } : {});
    }

    static async getPermissionsByWorkspaceIdWithCount(
        workspaceId: string,
        limit: number,
        step: number,
    ): Promise<{ permissions: IPermission[]; count: number }> {
        const [permissions, count] = await Promise.all([
            PermissionsModel.find({ workspaceId }, { limit, skip: step * limit })
                .lean()
                .exec(),
            PermissionsModel.countDocuments({ workspaceId }),
        ]);

        return { permissions, count };
    }
}

export default PermissionsManager;
