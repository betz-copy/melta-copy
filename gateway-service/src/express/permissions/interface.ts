export const resourceTypeOptions = ['Templates', 'Instances', 'Permissions'] as const;
export type ResourceType = typeof resourceTypeOptions[number];

export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = typeof scopeOptions[number];

export interface IPermission {
    id: string;
    userId: string;
    resourceType: ResourceType;
    category: string; // support 'all' or just make it optional
    scopes: Scope[];
}

export interface ICheckAuthorizationResult {
    authorized: boolean;
    metadata: Object;
}
