import { IGenericPermission, PermissionType } from '.';

export type IAdminPermission = IGenericPermission<PermissionType.admin>;
export type IRulesPermission = IGenericPermission<PermissionType.rules>;
export type IPermissionsPermission = IGenericPermission<PermissionType.permissions>;
export type IProcessesPermission = IGenericPermission<PermissionType.processes>;
export type ITemplatesPermission = IGenericPermission<PermissionType.templates>;
export type IInstancesPermission = IGenericPermission<
    PermissionType.instances,
    {
        categoryId?: string;
        entityTemplateId?: string;
        field?: string;
    }
>;

export type IPermission =
    | IAdminPermission
    | IRulesPermission
    | IPermissionsPermission
    | IProcessesPermission
    | ITemplatesPermission
    | IInstancesPermission;
