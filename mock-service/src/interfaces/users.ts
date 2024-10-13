import { ICompactPermissions } from './permissions/permissions';

export interface IBaseUser {
    _id: string;
    fullName: string;
    jobTitle: string;
    hierarchy: string;
    mail: string;
    profile?: string;
    preferences: {
        darkMode?: boolean;
        mailsNotificationsTypes?: any[];
    };
    externalMetadata: {
        kartoffelId: string;
        digitalIdentitySource: string;
    };
}
export interface IUser extends IBaseUser {
    permissions: ICompactPermissions;
}
