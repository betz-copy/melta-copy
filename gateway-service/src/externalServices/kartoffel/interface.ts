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

export interface IKartoffelUser {
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
}
