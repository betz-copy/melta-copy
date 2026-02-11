import { FileDetails } from '@packages/common';
import { NotificationType } from '@packages/notification';
import { ICompactPermissions, ISubCompactPermissions } from '@packages/permission';
import { IRole } from '@packages/role';

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
    kartoffelId: string;
    roleIds?: string[];
    units?: Record<string, string[]>;
}

export interface IUser extends IBaseUser {
    permissions: ICompactPermissions;
    roleIds?: string[];
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
}

export interface IUserPopulated extends Omit<IUser, 'roleIds'> {
    roles?: IRole[];
}

export enum RelatedPermission {
    User = 'user',
    Role = 'role',
}

export interface IMongoUser extends IUser {
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserSearchBody {
    search?: string;
    permissions?: ISubCompactPermissions;
    workspaceIds?: string[];
    limit: number;
    step?: number;
    ids?: string[];
    filterModel?: Record<string, object>;
    sortModel?: object[];
}

export type IUserPreferences = Pick<IBaseUser, 'preferences'>['preferences'] & {
    icon?: FileDetails;
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
    usersUnitsWithInheritance: string[];
}

export type IExternalUser = Omit<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'> &
    Partial<Pick<IUser, 'fullName' | 'jobTitle' | 'hierarchy' | 'mail'>>;

export type { IKartoffelUser, IKartoffelUserDigitalIdentity, IKartoffelUserRole, IKartoffelUserStringFields } from '@packages/common';
