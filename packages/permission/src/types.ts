import { IRole } from '@packages/role';
import { IUser } from '@packages/user';

export enum PermissionScope {
    read = 'read',
    write = 'write',
}
export const PermissionScopeOptions = Object.values(PermissionScope);

export enum PermissionType {
    admin = 'admin',
    rules = 'rules',
    permissions = 'permissions',
    processes = 'processes',
    templates = 'templates',
    instances = 'instances',
    units = 'units',
}
export const PermissionTypeOptions = Object.values(PermissionType);

export type IDefaultPermissionDetails = { scope?: PermissionScope };
export type IPermissionMetadata<H extends readonly string[] = [], D extends Object = IDefaultPermissionDetails> = D &
    ([...H] extends [H[0], ...infer R extends string[]] ? Record<H[0], Record<string, IPermissionMetadata<R, D>>> : object);

export interface IBasePermission<
    T extends PermissionType = PermissionType,
    H extends readonly string[] = [],
    D extends Object = IDefaultPermissionDetails,
> {
    _id: string;
    relatedId: string;
    workspaceId: string;
    type: T;
    metadata: IPermissionMetadata<H, D>;
}

export type PermissionData = IUser | IRole;

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
export type IUnitsPermission = IBasePermission<PermissionType.units>;

export type IPermission =
    | IAdminPermission
    | IRulesPermission
    | IPermissionsPermission
    | IProcessesPermission
    | ITemplatesPermission
    | IInstancesPermission
    | IUnitsPermission;

export type ICompact<P extends IPermission> = P['metadata'];

export type ISubCompactPermissions = {
    [PermissionType.admin]?: ICompact<IAdminPermission>;
    [PermissionType.rules]?: ICompact<IRulesPermission>;
    [PermissionType.permissions]?: ICompact<IPermissionsPermission>;
    [PermissionType.processes]?: ICompact<IProcessesPermission>;
    [PermissionType.templates]?: ICompact<ITemplatesPermission>;
    [PermissionType.instances]?: ICompact<IInstancesPermission>;
    [PermissionType.units]?: ICompact<IUnitsPermission>;
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
