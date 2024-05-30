import { IMongoCategory } from '../../interfaces/categories';
import { IPermissionsOfUser, Scope } from '../../services/permissionsService';

export const checkUserInstanceOfCategoryPermission = (
    instancesPermissions: IPermissionsOfUser['instancesPermissions'],
    { _id: categoryId }: IMongoCategory,
    scope: Scope,
) => {
    return instancesPermissions.some(({ category, scopes }) => {
        if (category !== categoryId) return false;

        if (scope === 'Write') return scopes.includes('Write');

        return scopes.includes('Write') || scopes.includes('Read');
    });
};

export const getUserPermissionScopeOfCategory = (instancesPermissions: IPermissionsOfUser['instancesPermissions'], categoryId: string) => {
    const permission = instancesPermissions.find(({ category }) => category === categoryId);

    if (permission?.scopes.includes('Write')) return 'Write';
    if (permission?.scopes.includes('Read')) return 'Read';
    return undefined;
};
