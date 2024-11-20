import { IMongoCategory } from '@microservices/shared';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompactPermissions } from '../../interfaces/permissions/permissions';

export interface SyncUserPermissions {
    userId: string;
    permissions: ICompactPermissions;
}

export const getPermissionsToCreate = (rootWorkspaceId: string, mainWorkspaceId: string, categories: IMongoCategory[]): ICompactPermissions => {
    return {
        [rootWorkspaceId]: { admin: { scope: PermissionScope.write } },
        [mainWorkspaceId]: {
            permissions: { scope: PermissionScope.write },
            templates: { scope: PermissionScope.write },
            rules: { scope: PermissionScope.write },
            processes: { scope: PermissionScope.write },
            instances: {
                categories: Object.fromEntries(categories.map(({ _id }) => [_id, { entityTemplates: {}, scope: PermissionScope.write }])),
            },
        },
    };
};
