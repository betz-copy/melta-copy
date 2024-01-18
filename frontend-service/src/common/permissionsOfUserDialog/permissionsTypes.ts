import { IUser } from '../../services/kartoffelService';
import { IPermission } from '../../services/permissionsService';

export type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    doesHaveRulesManagement: boolean;
    doesHaveProcessesManagement: boolean;
    instancesPermissions: Pick<IPermission, 'category' | 'scopes'>[];
};
