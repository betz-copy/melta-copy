import { IBasePermission, PermissionType } from '.';

export type IAdminPermission = IBasePermission<PermissionType.admin>;
export type IRulesPermission = IBasePermission<PermissionType.rules>;
export type IPermissionsPermission = IBasePermission<PermissionType.permissions>;
export type IProcessesPermission = IBasePermission<PermissionType.processes>;
export type ITemplatesPermission = IBasePermission<PermissionType.templates>;
export const IInstancePermissionClassHierarchy = ['categories', 'entityTemplates', 'fields'] as const;
export type IInstancesPermission = IBasePermission<PermissionType.instances, typeof IInstancePermissionClassHierarchy>;

export type IPermission =
    | IAdminPermission
    | IRulesPermission
    | IPermissionsPermission
    | IProcessesPermission
    | ITemplatesPermission
    | IInstancesPermission;

export type ICompact<P extends IPermission> = P['metadata'];
export type IPermissionsCompact = Partial<{
    [PermissionType.admin]: ICompact<IAdminPermission>;
    [PermissionType.rules]: ICompact<IRulesPermission>;
    [PermissionType.permissions]: ICompact<IPermissionsPermission>;
    [PermissionType.processes]: ICompact<IProcessesPermission>;
    [PermissionType.templates]: ICompact<ITemplatesPermission>;
    [PermissionType.instances]: ICompact<IInstancesPermission>;
}>;
