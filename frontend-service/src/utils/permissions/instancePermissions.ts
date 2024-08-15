import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission } from '../../interfaces/permissions/permissions';

export const checkUserCategoryPermission = (
    categoriesPermissions: ICompact<IInstancesPermission>['categories'],
    { _id: categoryId }: IMongoCategory,
    scope: PermissionScope,
): boolean => {
    return categoriesPermissions[categoryId]?.scope === scope || categoriesPermissions[categoryId]?.scope === PermissionScope.write;
};

export const getUserPermissionScopeOfCategory = (categoriesPermissions: ICompact<IInstancesPermission>['categories'], categoryId: string) => {
    return categoriesPermissions[categoryId]?.scope ?? undefined;
};
