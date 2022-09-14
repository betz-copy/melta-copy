import axios from 'axios';
import config from '../config';

const { permissionApi } = config;

export const resourceTypeOptions = ['Templates', 'Instances', 'Permissions', 'Rules'] as const;
export type ResourceType = typeof resourceTypeOptions[number];

export const scopeOptions = ['Read', 'Write'] as const;
export type Scope = typeof scopeOptions[number];

export interface IPermission {
    _id: string;
    userId: string;
    resourceType: ResourceType;
    category: string;
    scopes: Scope[];
}

export interface ICheckAuthorizationResult {
    authorized: boolean;
    metadata: Object;
}

const permissionsAxios = axios.create({
    baseURL: permissionApi.baseUrl,
    timeout: permissionApi.requestTimeout,
});

export const getPermissions = async (query: Partial<Pick<IPermission, 'userId' | 'resourceType' | 'category'>> = {}) => {
    const { data } = await permissionsAxios.get<IPermission[]>(permissionApi.baseRoute, { params: query });

    return data;
};

export const createPermission = async (permission: Omit<IPermission, '_id'>) => {
    const { data } = await permissionsAxios.post<IPermission>(permissionApi.baseRoute, permission);

    return data;
};

export const deletePermission = async (id: string) => {
    const { data } = await permissionsAxios.delete<IPermission>(`${permissionApi.baseRoute}/${id}`);

    return data;
};
export const deletePermissionsUnderCategory = async (categoryId: string) => {
    const { data } = await permissionsAxios.delete(`${permissionApi.baseRoute}`, { params: { category: categoryId } });

    return data;
};

export const checkUserAuthorization = async (userId: string, resourceType: ResourceType, relatedCategories: string[], operation: Scope) => {
    const { data } = await permissionsAxios.post<ICheckAuthorizationResult>(
        `${permissionApi.baseRoute}/${userId}/${permissionApi.checkAuthorizationRoute}`,
        {
            resourceType,
            relatedCategories,
            operation,
        },
    );

    return data;
};

export const isRuleManager = async (userId: string) => {
    const { authorized } = await checkUserAuthorization(userId, 'Rules', ['All'], 'Read');
    return authorized;
};
