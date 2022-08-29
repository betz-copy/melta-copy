import { ResourceType } from '../../externalServices/permissionsApi';
import { IUser } from '../users/interface';

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: ResourceType;
    category: string;
}

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    rulesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category'>[];
}
