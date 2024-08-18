import isEqualWith from 'lodash.isequalwith';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';

export const userHasNoPermissions = ({ permissions, templates, processes, rules, instances }: ISubCompactPermissions) => {
    return (
        permissions?.scope !== PermissionScope.write &&
        templates?.scope !== PermissionScope.write &&
        processes?.scope !== PermissionScope.write &&
        rules?.scope !== PermissionScope.write &&
        Object.keys(instances?.categories ?? {}).length === 0
    );
};

export const didPermissionsChange = (currentPermissions: IUser['permissions'], newPermissions: IUser['permissions']) =>
    isEqualWith(currentPermissions, newPermissions);
