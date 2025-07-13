import isEqualWith from 'lodash.isequalwith';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';
import { IMongoCategory } from '../../interfaces/categories';
import { ViewType } from '../../interfaces/childTemplates';

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

export type childTemplatePermissionDialog = {
    id: string;
    name: string;
    parentTemplateId: string;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    viewType: ViewType;
};

export type entityTemplatePermissionDialog = {
    id: string;
    name: string;
    childTemplates: childTemplatePermissionDialog[];
};

export type CategoryWithTemplates = IMongoCategory & {
    entityTemplates: entityTemplatePermissionDialog[];
};
