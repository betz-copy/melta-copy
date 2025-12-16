import { IRole } from '../role';
import { IUser } from '../user';

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

export * from './permissions';
