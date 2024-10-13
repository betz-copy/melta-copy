import fileDetails from './fileDetails';
import { NotificationType } from './notifications';
import { ICompactPermissions, ISubCompactPermissions } from './permissions/permissions';

export interface IBaseUser {
    _id: string;
    fullName: string;
    jobTitle: string;
    hierarchy: string;
    mail: string;
    profile?: string;
    preferences: {
        darkMode?: boolean;
        mailsNotificationsTypes?: NotificationType[];
        profilePath?: string;
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
    permissions?: ISubCompactPermissions;
    workspaceIds?: string[];
    limit: number;
    step?: number;
}

export type IUserPreferences = Pick<IBaseUser, 'preferences'>['preferences'] & {
    icon?: fileDetails;
    kartoffelProfile?: boolean;
};

export type IExternalUser = Omit<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'> &
    Partial<Pick<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'>>;
