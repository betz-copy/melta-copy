import * as pLimit from 'p-limit';
import {
    IPermission,
    getPermissions,
    createPermission,
    deletePermission,
    deletePermissionsUnderCategory,
} from '../../externalServices/permissionsApi';
import { IPermissionsOfUser, IPermission as IPermissionPopulated } from './interfaces';
import UsersManager from '../users/manager';
import config from '../../config';
import { objectMap } from '../../utils/object/promises';

const { getUsersLimitForPermissionsOfUsers } = config;

export class PermissionsManager {
    private static emptyPermissionsOfUser: Omit<IPermissionsOfUser, 'user'> = {
        permissionsManagementId: null,
        templatesManagementId: null,
        instancesPermissions: [],
    };

    private static addPermissionToPermissionsOfUser(
        permissionsOfUser: Omit<IPermissionsOfUser, 'user'>,
        permission: Omit<IPermission, 'userId'>,
    ): Omit<IPermissionsOfUser, 'user'> {
        if (permission.resourceType === 'Permissions') {
            return { ...permissionsOfUser, permissionsManagementId: permission._id };
        }

        if (permission.resourceType === 'Templates') {
            return { ...permissionsOfUser, templatesManagementId: permission._id };
        }

        const instancesPermissions: IPermissionsOfUser['instancesPermissions'] = [
            ...permissionsOfUser.instancesPermissions,
            { _id: permission._id, category: permission.category },
        ];
        return { ...permissionsOfUser, instancesPermissions };
    }

    private static mergePermissionsOfUsersByUserId(permissions: IPermission[]) {
        const permissionsOfUsersObj: Record<string, Omit<IPermissionsOfUser, 'user'>> = {};

        permissions.forEach((permission) => {
            let currPermissionsOfUser = permissionsOfUsersObj[permission.userId];

            if (!currPermissionsOfUser) {
                currPermissionsOfUser = PermissionsManager.emptyPermissionsOfUser;
            }

            const newPermissionsOfUser = PermissionsManager.addPermissionToPermissionsOfUser(currPermissionsOfUser, permission);
            permissionsOfUsersObj[permission.userId] = newPermissionsOfUser;
        });

        return permissionsOfUsersObj;
    }

    private static async populateUsersToPermissionsOfUsers(permissionsOfUsersObj: Record<string, Omit<IPermissionsOfUser, 'user'>>) {
        const pLimitGetUsers = pLimit(getUsersLimitForPermissionsOfUsers);

        const populatedPermissionsOfUsers = await objectMap(permissionsOfUsersObj, async (userId, permissionsOfUser) => {
            const user = await pLimitGetUsers(() => UsersManager.getUserById(userId));
            return {
                user,
                ...permissionsOfUser,
            } as IPermissionsOfUser;
        });

        return populatedPermissionsOfUsers;
    }

    static async getPermissionsOfUsers() {
        const permissions = await getPermissions();

        const permissionsOfUsersIdsObj = PermissionsManager.mergePermissionsOfUsersByUserId(permissions);
        const permissionsOfUsersObj = await PermissionsManager.populateUsersToPermissionsOfUsers(permissionsOfUsersIdsObj);

        return Object.values(permissionsOfUsersObj);
    }

    static async getPermissionsOfUser(userId: string) {
        const user = await UsersManager.getUserById(userId);
        let permissionsOfUser = PermissionsManager.emptyPermissionsOfUser;

        const permissions = await getPermissions({ userId: user.id });
        permissions.forEach((permission) => {
            permissionsOfUser = PermissionsManager.addPermissionToPermissionsOfUser(permissionsOfUser, permission);
        });

        return { user, ...permissionsOfUser } as IPermissionsOfUser;
    }

    private static getPermissionPopulatedFromPermission(permission: IPermission): IPermissionPopulated {
        const { scopes, ...restOfPermission } = permission;
        return restOfPermission;
    }

    static async createPermissionsBulk(permissions: Omit<IPermissionPopulated, '_id'>[]) {
        const createdPermissionsPromises = permissions.map((permission) => createPermission({ ...permission, scopes: ['Read', 'Write'] }));
        const createdPermissions = await Promise.all(createdPermissionsPromises);
        return createdPermissions.map((createdPermission) => PermissionsManager.getPermissionPopulatedFromPermission(createdPermission));
    }

    static async deletePermissions(ids: string[]) {
        const deletedPermissions = await Promise.all(ids.map((id) => deletePermission(id)));
        return deletedPermissions.map((deletedPermission) => PermissionsManager.getPermissionPopulatedFromPermission(deletedPermission));
    }

    static deletePermissionsOfCategory(categoryId: string) {
        return deletePermissionsUnderCategory(categoryId);
    }
}

export default PermissionsManager;
