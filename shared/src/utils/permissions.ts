import { ISubCompactPermissions } from '../interfaces/permission';

const isWorkspaceAdmin = (permissions: ISubCompactPermissions) => Boolean(permissions?.admin) || false;

export { isWorkspaceAdmin };
