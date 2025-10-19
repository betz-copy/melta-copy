import { ICompactPermissions } from './permissions/permissions';

export interface IBaseRole {
    _id: string;
    name: string;
}

export interface IRole extends IBaseRole {
    permissions: ICompactPermissions;
}

export interface IMongoRole extends IRole {
    createdAt: Date;
    updatedAt: Date;
}
