import { ICompactPermissions } from './types';

const isAdmin = (permissions: ICompactPermissions, workspaceIds: string[]) => workspaceIds.some((workspaceId) => permissions?.[workspaceId]?.admin);

export { isAdmin };
