import { ResourceType } from '../../externalServices/permissionsApi';
import { IUser } from '../users/interface';

export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = (typeof scopeOptions)[number];

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: ResourceType;
    category: string;
    scopes: Scope[];
}

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    processesManagementId: string | null;
    rulesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category' | 'scopes'>[];
}
