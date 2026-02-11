import { IMongoCategory } from '@packages/category';
import { ICompactPermissions, PermissionScope } from '@packages/permission';

export interface SyncUserPermissions {
    relatedId: string;
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
