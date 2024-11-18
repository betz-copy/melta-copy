import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission, ISubCompactPermissions } from '../../interfaces/permissions/permissions';

export const checkUserCategoryPermission = (
    permissions: ISubCompactPermissions,
    { _id: categoryId }: IMongoCategory,
    scope: PermissionScope,
): boolean => {
    return (
        Boolean(permissions?.admin) ||
        permissions?.instances?.categories[categoryId]?.scope === scope ||
        permissions?.instances?.categories[categoryId]?.scope === PermissionScope.write
    );
};

export const getUserPermissionScopeOfCategory = (categoriesPermissions: ICompact<IInstancesPermission>['categories'], categoryId: string) => {
    return categoriesPermissions[categoryId]?.scope ?? undefined;
};

export const getCategoryPermissionsToSyncAndDelete = (instances: ISubCompactPermissions['instances']) => {
    const categoryPermissionsToSync = {};
    const categoryPermissionsToDelete = {};

    if (!instances) return { categoryPermissionsToSync, categoryPermissionsToDelete };

    for (const [categoryId, categoryPermission] of Object.entries(instances.categories)) {
        (categoryPermission?.scope === null || categoryPermission?.scope === undefined ? categoryPermissionsToDelete : categoryPermissionsToSync)[
            categoryId
        ] = instances.categories[categoryId];
    }

    return { categoryPermissionsToSync, categoryPermissionsToDelete };
};
