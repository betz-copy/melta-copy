import { EmptyObject } from '../../../utils/types';

export enum PermissionType {
    admin = 'admin',
    rules = 'rules',
    permissions = 'permissions',
    processes = 'processes',
    templates = 'templates',
    instances = 'instances',
}
export const PermissionTypeOptions = Object.values(PermissionType);

export enum PermissionScope {
    read = 'read',
    write = 'write',
}
export const PermissionScopeOptions = Object.values(PermissionScope);

export interface IGenericPermission<T extends PermissionType = PermissionType, M extends object = EmptyObject> {
    id: string;
    userId: string;
    scopes: PermissionScope;
    type: T;
    metadata: M;
}
