import axios from 'axios';
import config from '../config';
import { ServiceError } from '../express/error';
import { ICheckAuthorizationResult, Scope } from '../express/permissions/interface';

const { permissionApi } = config;

const PermissionApi = axios.create({
    baseURL: permissionApi.url,
    timeout: permissionApi.requestTimeout,
});

export const translateMethodToOperation = (method: string) => {
    const { operationToScopeTranslator } = config;

    const translatorEntries = Object.entries(operationToScopeTranslator);

    const relevantEntry = translatorEntries.find((entry) => {
        const [_scope, values] = entry;

        return values.includes(method);
    });

    if (!relevantEntry) {
        throw new ServiceError(400, `method ${method} isn't supported`);
    }

    const [scope] = relevantEntry;

    return scope as Scope;
};

export const checkAuthorization = async (userId: string, resourceType: string, relatedCategories: string[], operation: string) => {
    const { data } = await PermissionApi.post(`${permissionApi.getPermissionsRoute}/${userId}/${[permissionApi.checkAuthorizationRoute]}`, {
        resourceType,
        relatedCategories,
        operation,
    });

    return data as ICheckAuthorizationResult;
};
