import { IUser } from '../interfaces/users';
import { defaultMetadata, WorkspaceState } from '../stores/workspace';

export const getWorkspacePermissions = async (permissions: IUser['permissions'], hierarchyIds: string[]) => {
    const hierarchyId = hierarchyIds.find((id) => Boolean(permissions[id]));

    if (!hierarchyId) return;

    return permissions[hierarchyId];
};

export const handleWorkspace = (title: string, setWorkspace: WorkspaceState['setWorkspace'], workspace?: WorkspaceState['workspace']) => {
    if (!workspace) return;
    setWorkspace({
        ...workspace,
        metadata: {
            ...defaultMetadata,
            ...(workspace.metadata || {}),
        },
    });
    document.title = title;
};
