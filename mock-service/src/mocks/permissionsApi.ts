import { IMongoCategory } from '../categories';
import { IPermission } from '../permissionsApi';

const user1KartoffelId = '5e5688324203fc40043591aa';

export const getPermissionsToCreate = (categories: IMongoCategory[]) => {
    const permissionsResourcePermission: IPermission = {
        userId: user1KartoffelId,
        resourceType: 'Permissions',
        category: 'All',
        scopes: ['Read', 'Write'],
    };

    const templatesResourcePermission: IPermission = {
        userId: user1KartoffelId,
        resourceType: 'Templates',
        category: 'All',
        scopes: ['Read', 'Write'],
    };

    const instancesResourcePermissions: IPermission[] = categories.map(({ _id }) => ({
        userId: user1KartoffelId,
        resourceType: 'Instances',
        category: _id,
        scopes: ['Read', 'Write'],
    }));

    return [permissionsResourcePermission, templatesResourcePermission, ...instancesResourcePermissions];
};
