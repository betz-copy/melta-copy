import { IMongoCategory } from '../categories';
import config from '../config/index';
import { PermissionScope } from '../interfaces/permissions';
import { ICompactPermissions } from '../interfaces/permissions/permissions';

export interface SyncUserPermissions {
    userId: string;
    permissions: ICompactPermissions;
}

export const getPermissionsToCreate = (workspaceId: string, categories: IMongoCategory[]): SyncUserPermissions[] => {
    return config.permissionsService.managersKartoffelIds.map((kartoffelId) => {
        return {
            userId: kartoffelId,
            permissions: {
                [workspaceId]: {
                    permissions: { scope: PermissionScope.write },
                    templates: { scope: PermissionScope.write },
                    rules: { scope: PermissionScope.write },
                    processes: { scope: PermissionScope.write },
                    instances: {
                        categories: Object.fromEntries(categories.map(({ _id }) => [_id, { entityTemplates: {}, scope: PermissionScope.write }])),
                    },
                },
            },
        };
    });
};
