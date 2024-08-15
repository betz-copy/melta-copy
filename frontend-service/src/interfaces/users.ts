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
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
}

export interface IUserSearchBody {
    search?: string;
    permissions?: ICompactPermissions;
    limit: number;
    step?: number;
}

export type IExternalUserDigitalIdentity = Pick<IUser, 'fullName' | 'mail' | 'jobTitle' | 'hierarchy' | 'displayName'>;

export interface IExternalUser {
    kartoffelId: string;
    digitalIdentities: {
        [source: string]: IExternalUserDigitalIdentity;
    };
}
