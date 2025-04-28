export const resourceTypeOptions = ['Templates', 'Instances', 'Permissions', 'Rules', 'Processes'] as const;
export type ResourceType = (typeof resourceTypeOptions)[number];

export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = (typeof scopeOptions)[number];

export interface IOldPermission {
    _id: string;
    userId: string;
    resourceType: ResourceType;
    category: string; // support 'all' or just make it optional
    scopes: Scope[];
}

export interface IKartoffelUser {
    id: string;
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
    digitalIdentities: { uniqueId: string; source: string }[];
    firstName?: string;
    lastName?: string;
    fullName: string;
}

export interface IPermissionsOfUser {
    user: IKartoffelUser;
    permissionsManagementId: string | null;
    templatesManagementId: string | null;
    processesManagementId: string | null;
    rulesManagementId: string | null;
    instancesPermissions: Pick<IOldPermission, '_id' | 'category' | 'scopes'>[];
}
