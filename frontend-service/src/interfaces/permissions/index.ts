export enum PermissionScope {
    read = 'read',
    write = 'write',
}

export enum PermissionType {
    admin = 'admin',
    rules = 'rules',
    permissions = 'permissions',
    processes = 'processes',
    templates = 'templates',
    instances = 'instances',
    childTemplates = 'childTemplates',
}

export type IDefaultPermissionDetails = { scope?: PermissionScope };
export type IPermissionMetadata<H extends readonly string[] = [], D extends Object = IDefaultPermissionDetails> = D &
    ([...H] extends [H[0], ...infer R extends string[]] ? Record<H[0], Record<string, IPermissionMetadata<R, D>>> : {});

export interface IBasePermission<
    T extends PermissionType = PermissionType,
    H extends readonly string[] = [],
    D extends Object = IDefaultPermissionDetails,
> {
    _id: string;
    userId: string;
    workspaceId: string;
    type: T;
    metadata: IPermissionMetadata<H, D>;
}
