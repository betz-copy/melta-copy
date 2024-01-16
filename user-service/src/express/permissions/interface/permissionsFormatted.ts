import { IGenericPermission, PermissionScope, PermissionType } from '.';

export type ISubPermissionFormatted<T extends {}> =
    | ({ [key in keyof T]: T[key] } & { all: false })
    | {
          all: true;
          permissionId: string;
          scopes: PermissionScope;
      };

export type IAdminPermissionFormatted = IGenericPermission<PermissionType.admin>;
export type IRulesPermissionFormatted = IGenericPermission<PermissionType.rules>;
export type IPermissionsPermissionFormatted = IGenericPermission<PermissionType.permissions>;
export type IProcessesPermissionFormatted = IGenericPermission<PermissionType.processes>;
export type ITemplatesPermissionFormatted = IGenericPermission<PermissionType.templates>;
export type IInstancesPermissionFormatted = Omit<
    IGenericPermission<
        PermissionType.instances,
        ISubPermissionFormatted<{
            categories: {
                [categoryId: string]: ISubPermissionFormatted<{
                    templates: {
                        [entityTemplateId: string]: ISubPermissionFormatted<{
                            instances: {
                                [instanceId: string]: {
                                    permissionId: string;
                                };
                            };
                        }>;
                    };
                }>;
            };
        }>
    >,
    'id' | 'scopes'
>;

export type IPermissionFormatted =
    | IAdminPermissionFormatted
    | IRulesPermissionFormatted
    | IPermissionsPermissionFormatted
    | IProcessesPermissionFormatted
    | ITemplatesPermissionFormatted
    | IInstancesPermissionFormatted;

export interface IPermissionsCompact {
    [PermissionType.admin]: IAdminPermissionFormatted;
    [PermissionType.rules]: IRulesPermissionFormatted;
    [PermissionType.permissions]: IPermissionsPermissionFormatted;
    [PermissionType.processes]: IProcessesPermissionFormatted;
    [PermissionType.templates]: ITemplatesPermissionFormatted;
    [PermissionType.instances]: IInstancesPermissionFormatted;
}
