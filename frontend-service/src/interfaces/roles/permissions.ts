import { IBaseRole } from '.';
import { PermissionType } from '../permissions';
import { IInstancePermissionOrderedHierarchy } from '../permissions/permissions';

export type IAdminRole = IBaseRole<PermissionType.admin>;
export type IRulesRole = IBaseRole<PermissionType.rules>;
export type IPermissionsRole = IBaseRole<PermissionType.permissions>;
export type IProcessesRole = IBaseRole<PermissionType.processes>;
export type ITemplatesRole = IBaseRole<PermissionType.templates>;
export type IInstancesRole = IBaseRole<PermissionType.instances, typeof IInstancePermissionOrderedHierarchy>;

export type IRole = IAdminRole | IRulesRole | IPermissionsRole | IProcessesRole | ITemplatesRole | IInstancesRole;

export type ICompact<P extends IRole> = P['metadata'];

export type ISubCompactRoles = {
    [PermissionType.admin]?: ICompact<IAdminRole>;
    [PermissionType.rules]?: ICompact<IRulesRole>;
    [PermissionType.permissions]?: ICompact<IPermissionsRole>;
    [PermissionType.processes]?: ICompact<IProcessesRole>;
    [PermissionType.templates]?: ICompact<ITemplatesRole>;
    [PermissionType.instances]?: ICompact<IInstancesRole>;
};

// [workspaceId: string]: ISubCompactRoles
export type ICompactRoles = Record<string, ISubCompactRoles>;
export type ICompactNullableRoles = Record<
    string,
    | {
          [K in keyof ISubCompactRoles]: ISubCompactRoles[K] | null;
      }
    | null
>;
