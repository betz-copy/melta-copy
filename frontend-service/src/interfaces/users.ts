import { AdvancedFilterModel, FilterModel, SortModelItem } from '@ag-grid-community/core';
import fileDetails from './fileDetails';
import { NotificationType } from './notifications';
import { ICompactPermissions, ISubCompactPermissions } from './permissions/permissions';

export interface IBaseUser {
    _id: string;
    fullName: string;
    jobTitle: string;
    hierarchy: string;
    mail: string;
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

export interface IMongoUser extends IUser {
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserSearchBody {
    permissions?: ISubCompactPermissions;
    workspaceIds?: string[];
    limit: number;
    step?: number;
    search?: string;
    filterModel?: AdvancedFilterModel | FilterModel | null;
    sortModel?: SortModelItem[];
}

export type IUserPreferences = Pick<IBaseUser, 'preferences'>['preferences'] & {
    icon?: fileDetails;
    kartoffelProfile?: boolean;
};

export interface ICurrentUser extends IUser {
    id: string;
    adfsId: string;
    isRoot: boolean;
    name: {
        firstName: string;
        lastName: string;
    };
    displayName: string;
    unit: string;
    rank: string;
    exp: number;
    iat: number;
    currentWorkspacePermissions: ISubCompactPermissions;
}

export type IExternalUser = Omit<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'> &
    Partial<Pick<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'>>;
