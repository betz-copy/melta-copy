import _cloneDeep from 'lodash.clonedeep';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission, ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IMongoCategory } from '../../interfaces/categories';
import { entityTemplatePermissionDialog } from './permissionOfUserDialog';

export const checkUserCategoryPermission = (
    permissions: ISubCompactPermissions,
    { _id: categoryId }: IMongoCategory,
    scope: PermissionScope,
): boolean => {
    return (
        Boolean(permissions?.admin) ||
        permissions?.instances?.categories[categoryId]?.scope === scope ||
        permissions?.instances?.categories[categoryId]?.scope === PermissionScope.write
    );
};

export const getUserPermissionScopeOfCategory = (categoriesPermissions: ICompact<IInstancesPermission>['categories'], categoryId: string) => {
    return categoriesPermissions[categoryId]?.scope ?? undefined;
};

export const getCategoryPermissionsToSyncAndDelete = (instances: ISubCompactPermissions['instances']) => {
    const categoryPermissionsToSync = {};
    const categoryPermissionsToDelete = {};

    if (!instances) return { categoryPermissionsToSync, categoryPermissionsToDelete };

    for (const [categoryId, categoryPermission] of Object.entries(instances.categories)) {
        ((categoryPermission?.scope === null || categoryPermission?.scope === undefined) &&
        Object.keys(categoryPermission?.entityTemplates).length === 0
            ? categoryPermissionsToDelete
            : categoryPermissionsToSync)[categoryId] = instances.categories[categoryId];
    }

    return { categoryPermissionsToSync, categoryPermissionsToDelete };
};

export const isWorkspaceAdmin = (permissions: ISubCompactPermissions) => Boolean(permissions?.admin) || false;

export const getNewScope = (oldScope: PermissionScope | undefined, clickedScope: PermissionScope, checked: boolean) => {
    let newScope: PermissionScope | undefined;
    if (clickedScope === PermissionScope.write) {
        if (checked) {
            newScope = PermissionScope.write;
        } else {
            newScope = PermissionScope.read;
        }
    } else if (clickedScope === PermissionScope.read) {
        if (checked) {
            if (oldScope === PermissionScope.write) {
                newScope = PermissionScope.write;
            } else {
                newScope = PermissionScope.read;
            }
        } else if (oldScope === PermissionScope.write) {
            newScope = PermissionScope.write;
        }
    }

    return newScope;
};

export const getChangedCategoryPermissions = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    id: string,
) => {
    const categoriesPermissions = { ...permissions };
    if (scope === PermissionScope.read) {
        const newScope: undefined | PermissionScope = getNewScope(categoriesPermissions?.[id]?.scope, scope, checked);
        const newTemplatePermission = {};

        if (categoriesPermissions?.[id]?.entityTemplates)
            Object.keys(categoriesPermissions?.[id]?.entityTemplates).forEach((key) => {
                if (categoriesPermissions?.[id]?.entityTemplates?.[key]?.scope === PermissionScope.write) {
                    newTemplatePermission[key] = {
                        scope: getNewScope(categoriesPermissions?.[id]?.entityTemplates?.[key]?.scope, scope, checked),
                        fields: {},
                    };
                }
            });

        return {
            entityTemplates: newTemplatePermission,
            scope: newScope,
        };
    }

    return {
        scope: getNewScope(categoriesPermissions?.[id]?.scope, scope, checked),
        entityTemplates: {},
    };
};

const changeSpecificTemplate = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateId: string,
) => {
    const categoriesPermissions = { ...permissions };
    const newScope = getNewScope(categoriesPermissions?.[categoryId]?.entityTemplates?.[templateId]?.scope, scope, checked);

    if (!newScope && Object.keys(categoriesPermissions?.[categoryId]?.entityTemplates?.[templateId]?.fields ?? {}).length === 0) {
        delete categoriesPermissions[categoryId].entityTemplates[templateId];
    } else {
        categoriesPermissions[categoryId] = {
            ...categoriesPermissions[categoryId],
            entityTemplates: {
                ...categoriesPermissions[categoryId]?.entityTemplates,
                [templateId]: {
                    ...categoriesPermissions[categoryId]?.entityTemplates?.[templateId],
                    scope: getNewScope(categoriesPermissions?.[categoryId]?.entityTemplates?.[templateId]?.scope, scope, checked),
                },
            },
        };
    }

    return categoriesPermissions;
};

const handleCheckCategoryByTemplates = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    categoryId: string,
    entityTemplates: entityTemplatePermissionDialog[],
) => {
    const categoriesPermissions = { ...permissions };
    let countRead = 0;
    let countWrite = 0;

    if (categoriesPermissions?.[categoryId]?.entityTemplates) {
        const templatesIds = Object.keys(categoriesPermissions[categoryId].entityTemplates);

        templatesIds.forEach((currTemplateId) => {
            if (categoriesPermissions[categoryId].entityTemplates?.[currTemplateId].scope === PermissionScope.read) countRead++;
            else if (categoriesPermissions[categoryId].entityTemplates?.[currTemplateId].scope === PermissionScope.write) countWrite++;
        });
    }

    if (countWrite + countRead === entityTemplates.length) {
        if (countWrite === entityTemplates.length) {
            categoriesPermissions[categoryId] = getChangedCategoryPermissions(categoriesPermissions, checked, PermissionScope.write, categoryId);
        } else {
            categoriesPermissions[categoryId] = getChangedCategoryPermissions(categoriesPermissions, checked, PermissionScope.read, categoryId);
        }
    }

    return categoriesPermissions;
};

const handleUncheckCategoryByTemplates = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateId: string,
    entityTemplates: entityTemplatePermissionDialog[],
) => {
    const categoriesPermissions = { ...permissions };

    const categoryScope = categoriesPermissions[categoryId]?.scope && getNewScope(categoriesPermissions[categoryId]?.scope, scope, checked);

    if (categoriesPermissions[categoryId]?.scope === PermissionScope.read) {
        entityTemplates.forEach((entityTemplate) => {
            if (entityTemplate.id !== templateId) {
                categoriesPermissions[categoryId].entityTemplates[entityTemplate.id] = {
                    scope: categoriesPermissions?.[categoryId]?.entityTemplates?.[entityTemplate.id]?.scope ?? PermissionScope.read,
                    fields: {},
                };
            }
        });
    } else if (categoriesPermissions[categoryId]?.scope === PermissionScope.write) {
        entityTemplates.forEach((entityTemplate) => {
            if (entityTemplate.id !== templateId) {
                categoriesPermissions[categoryId].entityTemplates[entityTemplate.id] = {
                    scope: PermissionScope.write,
                    fields: {},
                };
            }
        });
    }

    if (categoryScope) {
        categoriesPermissions[categoryId].scope = categoryScope;
    } else {
        delete categoriesPermissions[categoryId].scope;
    }

    return categoriesPermissions;
};
export const getChangedTemplatePermission = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateId: string,
    entityTemplates: entityTemplatePermissionDialog[],
) => {
    let categoriesPermissions = changeSpecificTemplate(permissions, checked, scope, categoryId, templateId);

    if (checked) {
        categoriesPermissions = handleCheckCategoryByTemplates(categoriesPermissions, checked, categoryId, entityTemplates);
    } else {
        categoriesPermissions = handleUncheckCategoryByTemplates(categoriesPermissions, checked, scope, categoryId, templateId, entityTemplates);
    }

    if (!categoriesPermissions?.[categoryId]?.scope && Object.keys(categoriesPermissions?.[categoryId]?.entityTemplates ?? {}).length === 0) {
        delete categoriesPermissions?.[categoryId];
    }

    return categoriesPermissions;
};
