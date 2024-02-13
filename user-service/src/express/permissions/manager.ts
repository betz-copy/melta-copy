import { transaction } from '../../utils/mongoose';
import { SinglePermissionOfTypePerUserError } from './errors';
import { PermissionType } from './interface';
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

    static async updatePermissionsOfUser(userId: string, permissionsCompact: ICompactNullablePermissions) {
        await transaction(async (session) => {
            const actions = Object.entries(permissionsCompact).map((entry) => {
                const [type, metadata] = entry as [PermissionType, ICompactNullablePermissions[PermissionType]];

                if (metadata === null) return PermissionsModel.deleteOne({ userId, type }, { session }).exec();
                return PermissionsModel.updateOne({ userId, type }, { metadata }, { upsert: true, session }).exec();
            });

            await Promise.all(actions);
        });
    }
}
