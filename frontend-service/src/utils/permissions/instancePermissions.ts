import { IMongoCategory } from '../../interfaces/categories';
import { IPermissionsOfUser } from '../../services/permissionsService';

export const canUserWriteInstanceOfCategory = (
    instancesPermissions: IPermissionsOfUser['instancesPermissions'],
    { _id: categoryId }: IMongoCategory,
) => {
    return instancesPermissions.some(({ category, scopes }) => category === categoryId && scopes?.includes('Write'));
};

export const canUserReadInstanceOfCategory = (
    instancesPermissions: IPermissionsOfUser['instancesPermissions'],
    { _id: categoryId }: IMongoCategory,
) => {
    return instancesPermissions.some(({ category, scopes }) => category === categoryId && (scopes?.includes('Write') || scopes?.includes('Read')));
};

export const getUserPermissionScopeOfCategory = (instancesPermissions: IPermissionsOfUser['instancesPermissions'], categoryId: string) => {
    const permission = instancesPermissions.find(({ category }) => category === categoryId);

    if (permission?.scopes.includes('Write')) return 'Write';
    if (permission?.scopes.includes('Read')) return 'Read';
    return undefined;
};
