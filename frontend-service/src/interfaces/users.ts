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
    akaUnit?: string;
    dischargeDay?: Date;
    rank?: string;
    mail?: string;
    jobTitle?: string;
    phone?: string[];
    mobilePhone?: string[];
    address?: string;
    clearance?: string;
    fullClearance?: string;
    sex?: string;
    birthDate?: Date;
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
