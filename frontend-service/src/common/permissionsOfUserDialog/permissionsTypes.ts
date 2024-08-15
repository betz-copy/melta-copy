import { ICompact, IInstancesPermission } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';

export type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    doesHaveRulesManagement: boolean;
    doesHaveProcessesManagement: boolean;
    categoriesPermissions: ICompact<IInstancesPermission>['categories'];
};
