import { IMongoProps } from '@packages/common';
import { ICompactPermissions } from '@packages/permission';

export interface IBaseRole {
    _id: string;
    name: string;
}

export interface IRole extends IBaseRole {
    permissions: ICompactPermissions;
}

export interface IMongoRole extends IRole, IMongoProps {}
