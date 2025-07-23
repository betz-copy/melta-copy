import { AdvancedFilterModel, FilterModel, SortModelItem } from '@ag-grid-community/core';
import fileDetails from './fileDetails';
import { NotificationType } from './notifications';
import { ICompactPermissions, ISubCompactPermissions } from './permissions/permissions';
import { IRole } from './roles';

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
    roleIds?: string[];
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
}

export interface IUserPopulated extends Omit<IUser, 'roleIds'> {
    roles?: IRole[];
}

export type PermissionData = IUser | IRole;

export enum RelatedPermission {
    User = 'user',
    Role = 'role',
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

export interface IKartoffelUserRole {
    roleId?: string;
    jobTitle?: string;
    directGroup?: string;
    clearance?: string;
    hierarchy?: string;
    hierarchyIds?: string[];
    source?: string;
    displayName?: string;
}

export interface IKartoffelUserDigitalIdentity {
    _id: string;
    entityId?: string;
    uniqueId?: string;
    source?: string;
    isRoleAttachable?: boolean;
    mail?: string;
    upn?: string;
    type?: string;
    role?: IKartoffelUserRole;
}

export type IKartoffelUser = {
    _id: string;
    id?: string;
    displayName?: string;
    entityType?: string;
    identityCard?: string;
    personalNumber?: string;
    goalUserId?: string;
    employeeNumber?: string;
    employeeId?: string;
    organization?: string;
    serviceType?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    birthDate?: Date;
    dischargeDay?: Date;
    enlistmentDay?: Date;
    akaUnit?: string;
    rank?: string;
    mail?: string;
    jobTitle?: string;
    phone?: string[];
    mobilePhone?: string[];
    address?: string;
    clearance?: string;
    fullClearance?: string;
    sex?: string;

    directGroup?: string;
    commanderOf?: string[];
    hierarchy?: string;
    hierarchyIds?: string[];
    pictures?: {
        profile?: {
            url?: string;
            meta?: {
                path?: string;
                format?: string;
                takenAt?: Date;
                updatedAt?: Date;
            };
        };
    };
    digitalIdentities?: IKartoffelUserDigitalIdentity[];
};

export type IKartoffelUserStringFields = Omit<IKartoffelUser, 'mobilePhone' | 'phone'> & { mobilePhone?: string; phone?: string };
