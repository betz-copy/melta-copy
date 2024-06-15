import { ICompactPermissions } from './permissions/permissions';

export interface IBaseUser {
    _id: string;
    fullName: string;
    jobTitle: string;
    hierarchy: string;
    mail: string;
    preferences: {
        darkMode?: boolean;
    };
    externalMetadata: {
        kartoffelId: string;
        digitalIdentitySource: string;
    };
}
export interface IUser extends IBaseUser {
    permissions: ICompactPermissions;
}

export interface IUserSearchBody {
    search: string;
    permissions: ICompactPermissions;
    limit: number;
    step: number;
}
