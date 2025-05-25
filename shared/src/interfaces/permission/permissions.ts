import { IBasePermission, PermissionType } from '.';

export enum InstancesSubclassesPermissions {
    categories = 'categories',
    entityTemplates = 'entityTemplates',
    fields = 'fields',
}
export const IInstancePermissionOrderedHierarchy = [
    InstancesSubclassesPermissions.categories,
    InstancesSubclassesPermissions.entityTemplates,
    InstancesSubclassesPermissions.fields,
] as const;

export type IAdminPermission = IBasePermission<PermissionType.admin>;
export type IRulesPermission = IBasePermission<PermissionType.rules>;
export type IPermissionsPermission = IBasePermission<PermissionType.permissions>;
export type IProcessesPermission = IBasePermission<PermissionType.processes>;
export type ITemplatesPermission = IBasePermission<PermissionType.templates>;
export type IInstancesPermission = IBasePermission<PermissionType.instances, typeof IInstancePermissionOrderedHierarchy>;

export type IPermission =
    | IAdminPermission
    | IRulesPermission
    | IPermissionsPermission
    | IProcessesPermission
    | ITemplatesPermission
    | IInstancesPermission;

export type ICompact<P extends IPermission> = P['metadata'];

export type ISubCompactPermissions = {
    [PermissionType.admin]?: ICompact<IAdminPermission>;
    [PermissionType.rules]?: ICompact<IRulesPermission>;
    [PermissionType.permissions]?: ICompact<IPermissionsPermission>;
    [PermissionType.processes]?: ICompact<IProcessesPermission>;
    [PermissionType.templates]?: ICompact<ITemplatesPermission>;
    [PermissionType.instances]?: ICompact<IInstancesPermission>;
};

// [workspaceId: string]: ISubCompactPermissions
export type ICompactPermissions = Record<string, ISubCompactPermissions>;
export type ICompactNullablePermissions = Record<
    string,
    | {
          [K in keyof ISubCompactPermissions]: ISubCompactPermissions[K] | null;
      }
    | null
>;
