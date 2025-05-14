import { IDefaultPermissionDetails, IPermissionMetadata, PermissionType } from '../../permissions/interface';

export interface IBaseRole<
    T extends PermissionType = PermissionType,
    H extends readonly string[] = [],
    D extends Object = IDefaultPermissionDetails,
> {
    _id: string;
    name: string;
    workspaceId: string;
    type: T;
    metadata: IPermissionMetadata<H, D>;
}
