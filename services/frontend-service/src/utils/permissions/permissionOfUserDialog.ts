import isEqualWith from 'lodash.isequalwith';
import { IUser } from '@microservices/shared';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';

export const userHasNoPermissions = (permissions: ISubCompactPermissions) => {
    return (
        permissions?.permissions?.scope !== PermissionScope.write &&
        permissions?.templates?.scope !== PermissionScope.write &&
        permissions?.processes?.scope !== PermissionScope.write &&
        permissions?.rules?.scope !== PermissionScope.write &&
        Object.keys(permissions?.instances?.categories ?? {}).length === 0
    );
};

export const didPermissionsChange = (currentPermissions: IUser['permissions'], newPermissions: IUser['permissions']) =>
    isEqualWith(currentPermissions, newPermissions);
