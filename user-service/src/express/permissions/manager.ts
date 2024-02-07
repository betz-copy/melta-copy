import { SinglePermissionOfTypePerUserError } from './errors';
import { IPermission, IPermissionsCompact } from './interface/permissions';
import { PermissionModel } from './model';

export class PermissionsManager {
    static async getPermissionsCompact(permissions: IPermission[]) {
        const compactPermissions: IPermissionsCompact = {};

        permissions.forEach((permission) => {
            if (compactPermissions[permission.type]) throw new SinglePermissionOfTypePerUserError(permission.type);
            compactPermissions[permission.type] = permission.metadata as any;
        });

        return compactPermissions;
    }

    static async getCompactPermissionsOfUser(userId: string) {
        const permissions = await PermissionModel.find({ userId }).lean().exec();
        return this.getPermissionsCompact(permissions);
    }
}
