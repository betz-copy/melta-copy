import { IUser } from '../../interfaces/users';

export type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    doesHaveRulesManagement: boolean;
    doesHaveProcessesManagement: boolean;
    instancesPermissions: IUser['permissions']['instances'];
};
