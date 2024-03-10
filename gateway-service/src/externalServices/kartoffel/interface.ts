export interface IKartoffelUser {
    address: string;
    akaUnit: string;
    birthDate: string;
    clearance: string;
    createdAt?: string;
    directGroup: string;
    dischargeDay: string;
    displayName: string;
    entityType: string;
    firstName: string;
    fullName?: string;
    goalUserId: string;
    hierarchy: string;
    id: string;
    identityCard: string;
    jobTitle: string;
    lastName: string;
    mail: string;
    mobilePhone: string[];
    personalNumber: string;
    phone: string[];
    pictures: {
        profile: {
            meta: {
                format: string;
                updatedAt: string;
            };
            url: string;
        };
    };
    rank: string;
    serviceType: string;
    sex: string;
    status?: string;
    updatedAt: string;
    digitalIdentities: {
        createdAt: string;
        entityId: string;
        isRoleAttachable: boolean;
        mail: string;
        source: string;
        type: string;
        uniqueId: string;
        updatedAt: string;
        role: {
            clearance?: string;
            createdAt?: string;
            digitalIdentityUniqueId: string;
            directGroup: string;
            hierarchy: string;
            hierarchyIds: string[];
            jobTitle: string;
            roleId: string;
            source: string;
            updatedAt?: string;
        };
    }[];
}
