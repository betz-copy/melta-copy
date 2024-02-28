import { FilterQuery } from 'mongoose';
import { typedObjectEntries } from '../../utils';
import { transaction } from '../../utils/mongoose';
import { SinglePermissionOfTypePerUserError } from './errors';
import { IPermission, ICompactPermissions, ICompactNullablePermissions } from './interface/permissions';
import { PermissionsModel } from './model';

export class PermissionsManager {
    static async getCompactPermissions(permissions: IPermission[]) {
        const compactPermissions: ICompactPermissions = {};

        permissions.forEach((permission) => {
            if (compactPermissions[permission.type]) throw new SinglePermissionOfTypePerUserError(permission.type);
            compactPermissions[permission.type] = permission.metadata as any;
        });

        return compactPermissions;
    }

    static async getCompactPermissionsOfUser(userId: string) {
        const permissions = await PermissionsModel.find({ userId }).lean().exec();
        return this.getCompactPermissions(permissions);
    }

    static async syncCompactPermissionsOfUser(userId: string, permissionsCompact: ICompactNullablePermissions) {
        await transaction(async (session) => {
            const actions = typedObjectEntries(permissionsCompact).map(([type, metadata]) => {
                if (metadata === null) return PermissionsModel.deleteOne({ userId, type }, { session }).exec();
                return PermissionsModel.updateOne({ userId, type }, { metadata }, { upsert: true, session }).exec();
            });

            await Promise.all(actions);
        });
    }

    static async searchByCompactPermissions(compactPermissions: ICompactPermissions) {
        const subQueries: FilterQuery<IPermission>[] = [];

        typedObjectEntries(compactPermissions).forEach(async ([type, metadata]) => {
            subQueries.push({ type, metadata });
        });

        return PermissionsModel.find({ $or: subQueries }).lean().exec();
    }
}
