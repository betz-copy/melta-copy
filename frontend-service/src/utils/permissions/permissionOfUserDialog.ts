import isEqualWith from 'lodash.isequalwith';
import { IFormPermissionsOfUser } from '../../common/permissionsOfUserDialog/permissionsTypes';
import { ICategoryMap } from '../../interfaces/categories';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';

export const doesUserHaveNoPermissions = (permissions: IFormPermissionsOfUser) => {
    return (
        !permissions.doesHavePermissionsManagement &&
        !permissions.doesHaveTemplatesManagement &&
        !permissions.doesHaveRulesManagement &&
        !permissions.doesHaveProcessesManagement &&
        Object.keys(permissions.categoriesPermissions).length === 0
    );
};

export const isPermissionsChanged = (currentPermissions: IFormPermissionsOfUser, newPermissions: IFormPermissionsOfUser) =>
    isEqualWith(currentPermissions, newPermissions, (firstValue, secondValue) => {
        if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
            const firstCategoriesPermissions = firstValue as IFormPermissionsOfUser['categoriesPermissions'];
            const secondCategoriesPermissions = secondValue as IFormPermissionsOfUser['categoriesPermissions'];

            const firstInstancesPermissionsSorted = firstCategoriesPermissions.sort((a, b) => {
                const categoryA = a.category ?? '';
                const categoryB = b.category ?? '';
                return categoryA.localeCompare(categoryB);
            });

            const secondInstancesPermissionsSorted = secondCategoriesPermissions.sort((a, b) => {
                const categoryA = a.category ?? '';
                const categoryB = b.category ?? '';
                return categoryA.localeCompare(categoryB);
            });

            return isEqualWith(firstInstancesPermissionsSorted, secondInstancesPermissionsSorted);
        }

        return undefined;
    });

export const permissionsToFormPermissions = (user: IUser, permissions: ISubCompactPermissions): IFormPermissionsOfUser => ({
    user,
    doesHavePermissionsManagement: Boolean(permissions.permissions?.scope),
    doesHaveTemplatesManagement: Boolean(permissions.templates?.scope),
    doesHaveRulesManagement: Boolean(permissions.rules?.scope),
    doesHaveProcessesManagement: Boolean(permissions.processes?.scope),
    categoriesPermissions: permissions.instances?.categories ?? {},
});

export const getPermissionsToDeleteUpdateAndCreate = (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: ICategoryMap,
    existingPermissionsOfUser?: IPermissionsOfUser,
): { permissionsIdsToDelete: string[]; permissionsToCreate: Omit<IPermission, '_id'>[]; permissionsToUpdate: IPermission[] } => {
    const permissionsIdsToDelete: string[] = [];
    const permissionsToCreate: Omit<IPermission, '_id'>[] = [];
    const permissionsToUpdate: IPermission[] = [];
    const defaultScopes = ['Read', 'Write'] as IPermission['scopes'];
    if (formPermissionsOfUser.doesHavePermissionsManagement && !existingPermissionsOfUser?.permissionsManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user._id,
            resourceType: PermissionResourceType.Permissions,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHavePermissionsManagement && existingPermissionsOfUser?.permissionsManagementId) {
        permissionsIdsToDelete.push(existingPermissionsOfUser.permissionsManagementId);
    }

    if (formPermissionsOfUser.doesHaveTemplatesManagement && !existingPermissionsOfUser?.templatesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user._id,
            resourceType: PermissionResourceType.Templates,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveTemplatesManagement && existingPermissionsOfUser?.templatesManagementId) {
        permissionsIdsToDelete.push(existingPermissionsOfUser.templatesManagementId);
    }

    if (formPermissionsOfUser.doesHaveRulesManagement && !existingPermissionsOfUser?.rulesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user._id,
            resourceType: PermissionResourceType.Rules,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveRulesManagement && existingPermissionsOfUser?.rulesManagementId) {
        permissionsIdsToDelete.push(existingPermissionsOfUser.rulesManagementId);
    }

    if (formPermissionsOfUser.doesHaveProcessesManagement && !existingPermissionsOfUser?.processesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user._id,
            resourceType: PermissionResourceType.Processes,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveProcessesManagement && existingPermissionsOfUser?.processesManagementId) {
        permissionsIdsToDelete.push(existingPermissionsOfUser.processesManagementId);
    }

    for (const id of categories.keys()) {
        const permissionsOfUserDialogStateForCategory = formPermissionsOfUser.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === id,
        );
        const existingPermissionsOfUserForCategory = existingPermissionsOfUser?.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === id,
        );

        if (permissionsOfUserDialogStateForCategory && !existingPermissionsOfUserForCategory) {
            permissionsToCreate.push({
                userId: formPermissionsOfUser.user._id,
                resourceType: PermissionResourceType.Instances,
                category: id,
                scopes: permissionsOfUserDialogStateForCategory.scopes,
            });
        } else if (!permissionsOfUserDialogStateForCategory && existingPermissionsOfUserForCategory) {
            permissionsIdsToDelete.push(existingPermissionsOfUserForCategory._id);
        } else if (permissionsOfUserDialogStateForCategory && existingPermissionsOfUserForCategory) {
            if (permissionsOfUserDialogStateForCategory.scopes.sort().join(',') !== existingPermissionsOfUserForCategory.scopes.sort().join(',')) {
                permissionsToUpdate.push({
                    ...existingPermissionsOfUserForCategory,
                    userId: formPermissionsOfUser.user._id,
                    resourceType: PermissionResourceType.Instances,
                    category: id,
                    scopes: permissionsOfUserDialogStateForCategory.scopes,
                });
            }
        }
    }

    return { permissionsIdsToDelete, permissionsToCreate, permissionsToUpdate };
};
