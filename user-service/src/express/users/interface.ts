import { ICompactPermissions } from '../permissions/interface/permissions';

export interface IBaseUser {
    _id: string;
    externalId: string;
    fullName: string;
    jobTitle: string;
    preferences: {
        darkMode?: boolean;
    };
}
export interface IUser extends IBaseUser {
    permissions: ICompactPermissions;
}

export interface IUserSearchBody {
    fullName?: string;
    jobTitle?: string;
    preferences?: IUser['preferences'];
    permissions?: IUser['permissions'];
}
