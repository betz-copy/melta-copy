import { ICompactPermissions } from '../interfaces/permission';

const isAdmin = (permissions: ICompactPermissions, workspaceIds: string[]) => workspaceIds.some((workspaceId) => permissions?.[workspaceId]?.admin);

export { isAdmin };
