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

    throw new Error('permission in hierarchy has not been found');
};
