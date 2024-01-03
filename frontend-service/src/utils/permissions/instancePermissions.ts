import { IMongoCategory } from '../../interfaces/categories';
import { IPermissionsOfUser } from '../../services/permissionsService';

const getUserCanWriteInstanceOfCategory = (instancesPermissions: IPermissionsOfUser['instancesPermissions'], categoryToCheck: IMongoCategory) => {
    const { _id: categoryId } = categoryToCheck;
    return instancesPermissions.some(({ category, scopes }) => category === categoryId && scopes?.includes('Write'));
};

const getUserCanReadInstanceOfCategory = (instancesPermissions: IPermissionsOfUser['instancesPermissions'], categoryToCheck: IMongoCategory) => {
    const { _id: categoryId } = categoryToCheck;
    return instancesPermissions.some(({ category, scopes }) => category === categoryId && (scopes?.includes('Write') || scopes?.includes('Read')));
};
const getUserPermissionTypeToCategory = (instancesPermissions: IPermissionsOfUser['instancesPermissions'], categoryId: string) => {
    const permission = instancesPermissions.find(({ category }) => category === categoryId);

    if (permission?.scopes.includes('Write')) return 'Write';
    if (permission?.scopes.includes('Read')) return 'Read';

    return undefined;
};

export { getUserPermissionTypeToCategory, getUserCanWriteInstanceOfCategory, getUserCanReadInstanceOfCategory };
