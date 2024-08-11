import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';

export const checkUserInstanceOfCategoryPermission = (
    instancesPermissions: ISubCompactPermissions['instances'],
    { _id: categoryId }: IMongoCategory,
    scope: PermissionScope,
): boolean => {
    return instancesPermissions?.categories[categoryId]?.scope === scope;
};

export const getUserPermissionScopeOfCategory = (instancesPermissions: ISubCompactPermissions['instances'], categoryId: string) => {
    return instancesPermissions?.categories[categoryId]?.scope ?? undefined;
};
