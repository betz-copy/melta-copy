import { IPermission } from '../../externalServices/permissionsService';
import { IUser } from '../users/interface';

export interface IPermissionsOfUser {
    user: IUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    processesManagementId: string | null;
    rulesManagementId: string | null;
    instancesPermissions: Pick<IPermission, '_id' | 'category' | 'scopes'>[];
}
