import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission, ISubCompactPermissions } from '../../interfaces/permissions/permissions';
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

export const checkUserTemplatePermission = (
    permissions: ISubCompactPermissions,
    { _id: categoryId }: Pick<IMongoCategory, '_id'>,
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
        newScope = checked ? PermissionScope.write : PermissionScope.read;
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
                    entityChildTemplates: categoriesPermissions?.[id]?.entityTemplates?.[key]?.entityChildTemplates ?? {},
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
    templateId: string,
) => {
    const categoriesPermissions = { ...permissions };
    const newScope = getNewScope(categoriesPermissions?.[categoryId]?.entityTemplates?.[templateId]?.scope, scope, checked);

    if (!newScope) {
        delete categoriesPermissions[categoryId].entityTemplates[templateId]?.scope;
    } else {
        categoriesPermissions[categoryId] = {
            ...categoriesPermissions[categoryId],
            entityTemplates: {
                ...categoriesPermissions[categoryId]?.entityTemplates,
                [templateId]: {
                    scope: newScope,
                    entityChildTemplates: categoriesPermissions[categoryId]?.entityTemplates?.[templateId]?.entityChildTemplates ?? {},
                },
            },
        };
    }

    return categoriesPermissions;
};

const changeSpecificChildTemplate = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateId: string,
    childTemplateId: string,
) => {
    const categoriesPermissions = { ...permissions };
    const newScope = getNewScope(
        categoriesPermissions?.[categoryId]?.entityTemplates?.[templateId]?.entityChildTemplates?.[childTemplateId]?.scope,
        scope,
        checked,
    );

    if (!newScope) {
        delete categoriesPermissions[categoryId].entityTemplates[templateId].entityChildTemplates[childTemplateId];
    } else {
        categoriesPermissions[categoryId] = {
            ...categoriesPermissions[categoryId],
            entityTemplates: {
                ...categoriesPermissions[categoryId]?.entityTemplates,
                [templateId]: {
                    ...categoriesPermissions[categoryId]?.entityTemplates?.[templateId],
                    entityChildTemplates: {
                        ...categoriesPermissions[categoryId]?.entityTemplates?.[templateId]?.entityChildTemplates,
                        [childTemplateId]: {
                            scope: newScope,
                            fields: {},
                        },
                    },
                },
            },
        };
    }

    return categoriesPermissions;
};

const handleCheckCategoryByTemplates = (
    permissions: ICompact<IInstancesPermission>['categories'],
    categoryId: string,
    entityTemplates: entityTemplatePermissionDialog[],
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

    if (countRead + countWrite === entityTemplates.length)
        categoriesPermissions[categoryId] = getChangedCategoryPermissions(
            categoriesPermissions,
            true,
            countWrite === entityTemplates.length ? PermissionScope.write : PermissionScope.read,
            categoryId,
        );

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

    if (categoriesPermissions[categoryId]?.scope) {
        entityTemplates.forEach((entityTemplate) => {
            if (entityTemplate.id !== templateId) {
                categoriesPermissions[categoryId].entityTemplates[entityTemplate.id] = {
                    scope:
                        categoriesPermissions[categoryId]?.scope === PermissionScope.write
                            ? PermissionScope.write
                            : categoriesPermissions?.[categoryId]?.entityTemplates?.[entityTemplate.id]?.scope ?? PermissionScope.read,
                    entityChildTemplates: categoriesPermissions?.[categoryId]?.entityTemplates?.[entityTemplate.id]?.entityChildTemplates ?? {},
                };
            }
        });
    }

    if (categoryScope) {
        categoriesPermissions[categoryId].scope = categoryScope;
    } else {
        delete categoriesPermissions[categoryId].scope;
    }

    return handleCheckCategoryByTemplates(categoriesPermissions, categoryId, entityTemplates);
};

export const getChangedTemplatePermission = (
    permissions: ICompact<IInstancesPermission>['categories'],
    checked: boolean,
    scope: PermissionScope,
    categoryId: string,
    templateId: string,
    entityTemplates: entityTemplatePermissionDialog[],
    childTemplateId?: string,
) => {
    let categoriesPermissions;
    if (childTemplateId) {
        categoriesPermissions = changeSpecificChildTemplate(permissions, checked, scope, categoryId, templateId, childTemplateId);
    } else {
        categoriesPermissions = changeSpecificTemplate(permissions, checked, scope, categoryId, templateId);
    }

    if (checked) {
        categoriesPermissions = handleCheckCategoryByTemplates(categoriesPermissions, categoryId, entityTemplates);
    } else {
        categoriesPermissions = handleUncheckCategoryByTemplates(categoriesPermissions, checked, scope, categoryId, templateId, entityTemplates);
    }

    if (!categoriesPermissions?.[categoryId]?.scope && Object.keys(categoriesPermissions?.[categoryId]?.entityTemplates ?? {}).length === 0) {
        delete categoriesPermissions?.[categoryId];
    }

    return categoriesPermissions;
};
