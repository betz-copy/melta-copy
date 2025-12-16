import { ICompact, IInstancesPermission, IMongoCategory, ISubCompactPermissions, PermissionScope } from '@microservices/shared';
import { childTemplatePermissionDialog, entityTemplatePermissionDialog } from './permissionOfUserDialog';

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

export const checkUserTemplatePermission = (
    permissions: ISubCompactPermissions,
    categoryId: string,
    templateId: string,
    scope: PermissionScope,
): boolean => {
    return (
        Boolean(permissions?.admin) ||
        permissions?.instances?.categories[categoryId]?.scope === scope ||
        permissions?.instances?.categories[categoryId]?.scope === PermissionScope.write ||
        permissions?.instances?.categories[categoryId]?.entityTemplates?.[templateId]?.scope === scope ||
        permissions?.instances?.categories[categoryId]?.entityTemplates?.[templateId]?.scope === PermissionScope.write
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
        newScope = checked ? PermissionScope.write : oldScope ? PermissionScope.read : undefined;
    } else {
        // eslint-disable-next-line no-nested-ternary
        newScope = oldScope === PermissionScope.write ? PermissionScope.write : checked ? PermissionScope.read : undefined;
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
    const newScope = getNewScope(categoriesPermissions?.[id]?.scope, scope, checked);
    const newTemplatePermission = {};

    if (scope === PermissionScope.read) {
        Object.keys(categoriesPermissions?.[id]?.entityTemplates ?? {}).forEach((key) => {
            if (categoriesPermissions?.[id]?.entityTemplates?.[key]?.scope === PermissionScope.write)
                newTemplatePermission[key] = {
                    scope: PermissionScope.write,
                };
        });
    }

    return {
        scope: newScope,
        entityTemplates: newTemplatePermission,
    };
};

const changeSpecificTemplate = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateIds: string[],
) => {
    return templateIds.reduce((acc, templateId) => {
        const newScope = getNewScope(acc?.[categoryId]?.entityTemplates?.[templateId]?.scope, scope, checked);

        if (!newScope) {
            delete acc[categoryId].entityTemplates[templateId];
        } else {
            acc[categoryId] = {
                ...acc[categoryId],
                entityTemplates: {
                    ...acc[categoryId]?.entityTemplates,
                    [templateId]: {
                        scope: newScope,
                        fields: {},
                    },
                },
            };
        }

        return acc;
    }, permissions);
};

const handleCheckCategoryByTemplates = (
    permissions: ICompact<IInstancesPermission>['categories'],
    categoryId: string,
    entityTemplates: entityTemplatePermissionDialog[],
    childTemplates: childTemplatePermissionDialog[],
) => {
    const categoriesPermissions = { ...permissions };
    let countRead = 0;
    let countWrite = 0;
    const templatesIds = Object.keys(categoriesPermissions[categoryId].entityTemplates ?? {});

    templatesIds.forEach((currTemplateId) => {
        const templateScope = categoriesPermissions[categoryId].entityTemplates?.[currTemplateId].scope;

        if (templateScope === PermissionScope.read) countRead++;
        else if (templateScope === PermissionScope.write) countWrite++;
    });

    const templatesCount = entityTemplates.length + childTemplates.length;

    if (countRead + countWrite === templatesCount)
        categoriesPermissions[categoryId] = getChangedCategoryPermissions(
            categoriesPermissions,
            true,
            countWrite === templatesCount ? PermissionScope.write : PermissionScope.read,
            categoryId,
        );

    return categoriesPermissions;
};

const handleUncheckCategoryByTemplates = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateIds: string[],
    entityTemplates: entityTemplatePermissionDialog[],
    childTemplates: childTemplatePermissionDialog[],
) => {
    return handleCheckCategoryByTemplates(
        templateIds.reduce((acc, templateId) => {
            const categoryScope = acc[categoryId]?.scope && getNewScope(acc[categoryId]?.scope, scope, checked);

            if (acc[categoryId]?.scope) {
                entityTemplates.forEach((entityTemplate) => {
                    if (entityTemplate.id !== templateId) {
                        acc[categoryId].entityTemplates[entityTemplate.id] = {
                            scope:
                                acc[categoryId]?.scope === PermissionScope.write
                                    ? PermissionScope.write
                                    : (acc?.[categoryId]?.entityTemplates?.[entityTemplate.id]?.scope ?? PermissionScope.read),
                            fields: {},
                        };
                    }
                });
            }

            if (categoryScope) {
                acc[categoryId].scope = categoryScope;
            } else {
                delete acc[categoryId].scope;
            }
            return acc;
        }, permissions),
        categoryId,
        entityTemplates,
        childTemplates,
    );
};

export const getChangedTemplatePermission = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateIds: string[],
    entityTemplates: entityTemplatePermissionDialog[],
    childTemplates: childTemplatePermissionDialog[],
) => {
    let categoriesPermissions = changeSpecificTemplate(permissions, checked, scope, categoryId, templateIds);

    if (checked) {
        categoriesPermissions = handleCheckCategoryByTemplates(categoriesPermissions, categoryId, entityTemplates, childTemplates);
    } else {
        categoriesPermissions = handleUncheckCategoryByTemplates(
            categoriesPermissions,
            checked,
            scope,
            categoryId,
            templateIds,
            entityTemplates,
            childTemplates,
        );
    }

    if (!categoriesPermissions?.[categoryId]?.scope && Object.keys(categoriesPermissions?.[categoryId]?.entityTemplates ?? {}).length === 0) {
        delete categoriesPermissions?.[categoryId];
    }

    return categoriesPermissions;
};
