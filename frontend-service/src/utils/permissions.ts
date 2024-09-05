import { IUser } from '../interfaces/users';
import { getWorkspaceHierarchyIds } from '../services/workspacesService';

export const getWorkspacePermissions = async (workspaceId: string, permissions: IUser['permissions']) => {
    const hierarchyIds = await getWorkspaceHierarchyIds(workspaceId);

    for (const currentWorkspaceId of Object.keys(permissions)) {
        const ancestorHierarchyId = hierarchyIds.find((hierarchyId) => hierarchyId === currentWorkspaceId);

        if (ancestorHierarchyId) {
            return permissions[ancestorHierarchyId];
        }
    }

    return permissions[workspaceId];
};
