import { IMongoCategory } from '../categories';
import { IPermission } from '../permissionsApi';
import config from '../config/index';

export const getPermissionsToCreate = (categories: IMongoCategory[]) => {
    const permissions: IPermission[] = [];

    config.permissionsApi.managersKrtoffelIds.forEach((kartoffelId) => {
        const permissionsResourcePermission: IPermission = {
            userId: kartoffelId,
            resourceType: 'Permissions',
            category: 'All',
            scopes: ['Read', 'Write'],
        };

        const templatesResourcePermission: IPermission = {
            userId: kartoffelId,
            resourceType: 'Templates',
            category: 'All',
            scopes: ['Read', 'Write'],
        };

        const rulesResourcePermission: IPermission = {
            userId: kartoffelId,
            resourceType: 'Rules',
            category: 'All',
            scopes: ['Read', 'Write'],
        };

        const instancesResourcePermissions: IPermission[] = categories.map(({ _id }) => ({
            userId: kartoffelId,
            resourceType: 'Instances',
            category: _id,
            scopes: ['Read', 'Write'],
        }));

        const processResourcePermission: IPermission = {
            userId: kartoffelId,
            resourceType: 'Processes',
            category: 'All',
            scopes: ['Read', 'Write'],
        };

        permissions.push(
            permissionsResourcePermission,
            processResourcePermission,
            templatesResourcePermission,
            rulesResourcePermission,
            ...instancesResourcePermissions,
        );
    });

    return permissions;
};
