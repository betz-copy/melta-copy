import { FilterQuery } from 'mongoose';
import { flattenObject, typedObjectEntries } from '../../utils';
import { transaction } from '../../utils/mongoose';
import { RecursiveNullable } from '../../utils/types';
import { UsersManager } from '../users/manager';
import { SinglePermissionOfTypePerUserError } from './errors';
import { ICompactNullablePermissions, ICompactPermissions, IPermission, ISubCompactPermissions } from './interface/permissions';
import { PermissionsModel } from './model';

export class PermissionsManager {
    static async getCompactPermissions(permissions: IPermission[]): Promise<ICompactPermissions> {
        const compactPermissions: ICompactPermissions = {};

        permissions.forEach(({ workspaceId, type, metadata }) => {
            if (compactPermissions[workspaceId]?.[type]) throw new SinglePermissionOfTypePerUserError(type);

            if (!compactPermissions[workspaceId]) compactPermissions[workspaceId] = {};
            compactPermissions[workspaceId][type] = metadata as any;
        });

        return compactPermissions;
    }

    static async getCompactPermissionsOfUser(userId: string, workspaceIds?: string[]): Promise<ICompactPermissions> {
        const query: FilterQuery<IPermission> = { userId };

        if (workspaceIds) query.workspaceId = { $in: workspaceIds };

        const permissions = await PermissionsModel.find(query).lean().exec();
        return this.getCompactPermissions(permissions);
    }

    static async syncCompactPermissionsOfUser(
        userId: string,
        permissionsCompact: ICompactNullablePermissions | ICompactPermissions,
    ): Promise<ICompactPermissions> {
        await UsersManager.getUserById(userId); // Validate user exists

        const updatedWorkspacesIds: string[] = [];

        await transaction(async (session) => {
            const actions: Promise<any>[] = [];

            typedObjectEntries(permissionsCompact).forEach(([workspaceId, subCompactPermission]) => {
                if (subCompactPermission === null) {
                    actions.push(PermissionsModel.deleteMany({ userId, workspaceId }, { session }).lean().exec());
                    return;
                }

                updatedWorkspacesIds.push(workspaceId);

                typedObjectEntries(subCompactPermission).forEach(([type, metadata]) => {
                    if (metadata === null) {
                        actions.push(PermissionsModel.deleteOne({ userId, type, workspaceId }, { session }).lean().exec());
                        return;
                    }

                    actions.push(PermissionsModel.updateOne({ userId, type, workspaceId }, { metadata }, { upsert: true, session }).lean().exec());
                });
            });

            await Promise.all(actions);
        });

        return this.getCompactPermissionsOfUser(userId, updatedWorkspacesIds);
    }

    static async deletePermissionsFromMetadata(
        query: Pick<IPermission, 'type' | 'workspaceId'> & { userId?: IPermission['userId'] },
        metadata: RecursiveNullable<ISubCompactPermissions>,
    ): Promise<void> {
        await PermissionsModel.updateMany(query, { $unset: flattenObject(metadata[query.type]!, ['metadata']) })
            .lean()
            .exec();
    }

    static async searchBySubCompactPermissions(subCompactPermissions: ISubCompactPermissions, workspaceId?: string): Promise<IPermission[]> {
        const query: FilterQuery<IPermission> = { workspaceId };
        const subQueries: FilterQuery<IPermission>[] = [];

        typedObjectEntries(subCompactPermissions).forEach(([type, metadata]) => {
            subQueries.push({ type, metadata });
        });

        if (subQueries.length) query.$or = subQueries;

        return PermissionsModel.find(query).lean().exec();
    }
}
