import { IUser } from '../users/interface';

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: 'Permissions' | 'Templates' | 'Instances';
    category: string;
}

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category'>[];
}
