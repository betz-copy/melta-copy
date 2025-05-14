import { FilterQuery } from 'mongoose';
import { flattenObject, typedObjectEntries } from '../../utils';
import { transaction } from '../../utils/mongoose';
import { RecursiveNullable } from '../../utils/types';
import { SinglePermissionOfTypePerRoleError } from './errors';
import { IRole, ICompactNullableRoles, ICompactRoles, ISubCompactRoles } from './interface/permissions';
import { RolesModel } from './model';

export class PermissionsManager {
    static async getCompactRoles(roles: IRole[]): Promise<ICompactRoles> {
        const compactPermissions: ICompactRoles = {};

        roles.forEach(({ workspaceId, type, metadata }) => {
            if (compactPermissions[workspaceId]?.[type]) throw new SinglePermissionOfTypePerRoleError(type);

            if (!compactPermissions[workspaceId]) compactPermissions[workspaceId] = {};
            compactPermissions[workspaceId][type] = metadata as any;
        });

        return compactPermissions;
    }

    static async getCompactPermissionsOfRole(roleName: string, workspaceIds?: string[]): Promise<ICompactRoles> {
        const query: FilterQuery<IRole> = { name: roleName };

        if (workspaceIds) query.workspaceId = { $in: workspaceIds };

        const permissions = await RolesModel.find(query).lean().exec();
        return this.getCompactRoles(permissions);
    }

    static async syncCompactPermissionsOfRole(name: string, permissionsCompact: ICompactNullableRoles | ICompactRoles): Promise<ICompactRoles> {
        const updatedWorkspacesIds: string[] = [];

        await transaction(async (session) => {
            const actions: Promise<any>[] = [];

            typedObjectEntries(permissionsCompact).forEach(([workspaceId, subCompactPermission]) => {
                if (subCompactPermission === null) {
                    actions.push(RolesModel.deleteMany({ name, workspaceId }, { session }).lean().exec());
                    return;
                }

                updatedWorkspacesIds.push(workspaceId);

                typedObjectEntries(subCompactPermission).forEach(([type, metadata]) => {
                    if (metadata === null) {
                        actions.push(RolesModel.deleteOne({ name, type, workspaceId }, { session }).lean().exec());
                        return;
                    }

                    actions.push(RolesModel.updateOne({ name, type, workspaceId }, { metadata }, { upsert: true, session }).lean().exec());
                });
            });

            await Promise.all(actions);
        });

        return this.getCompactPermissionsOfRole(name, updatedWorkspacesIds);
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IRole, 'type' | 'workspaceId'> & { name?: IRole['name'] },
        metadata: RecursiveNullable<ISubCompactRoles>,
    ): Promise<void> {
        await RolesModel.updateMany(query, { $unset: flattenObject(metadata[query.type]!, ['metadata']) })
            .lean()
            .exec();
    }

    //     static async searchBySubCompactPermissions(subCompactPermissions: ISubCompactRoles, workspaceIds?: string[]): Promise<IRole[]> {
    //         const workspaceId = workspaceIds ? workspaceIds[workspaceIds.length - 1] : undefined;

    //         const query: FilterQuery<IRole> = Object.keys(subCompactPermissions).length ? {} : { workspaceId };
    //         const subQueries: FilterQuery<IRole>[] = [];

    //         typedObjectEntries(subCompactPermissions).forEach(([type, metadata]) => {
    //             subQueries.push({ type, workspaceId, ...flattenObject(metadata!, ['metadata']) });
    //         });

    //         if (workspaceIds && workspaceIds.length > 1) {
    //             workspaceIds.pop();

    //             workspaceIds.forEach((workspaceId) => {
    //                 subQueries.push({ type: PermissionType.admin, metadata: { scope: PermissionScope.write }, workspaceId });
    //             });
    //         }

    //         if (subQueries.length) query.$or = subQueries;

    //         return RolesModel.find(query).lean().exec();
    //     }

    //     static async getRolesByWorkspaceId(workspaceId: string, pagination?: { step: number; limit: number }): Promise<IRole[]> {
    //         return RolesModel.find({ workspaceId }, pagination ? { limit: pagination.limit, skip: pagination.step } : {});
    //     }

    //     static async getRolesByWorkspaceIdWithCount(workspaceId: string, limit: number, step: number): Promise<{ roles: IRole[]; count: number }> {
    //         const [roles, count] = await Promise.all([
    //             RolesModel.find({ workspaceId }, { limit, skip: step * limit })
    //                 .lean()
    //                 .exec(),
    //             RolesModel.countDocuments({ workspaceId }),
    //         ]);

    //         return { roles, count };
    //     }
}
