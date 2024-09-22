import { IUser } from '../interfaces/users';
import { getWorkspaceHierarchyIds } from '../services/workspacesService';

export const getWorkspacePermissions = async (workspaceId: string, permissions: IUser['permissions']) => {
    const hierarchyIds = await getWorkspaceHierarchyIds(workspaceId);
    const hierarcyId = hierarchyIds.find((id) => Boolean(permissions[id]));

    if (!hierarcyId) return;

    return permissions[hierarcyId];
};
