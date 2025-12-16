import {
    IMongoCategory,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplatePopulated,
    ISubCompactPermissions,
    IUser,
    PermissionScope,
    ViewType,
} from '@microservices/shared';
import isEqualWith from 'lodash.isequalwith';

export const userHasNoPermissions = (permissions: ISubCompactPermissions) => {
    return (
        permissions?.permissions?.scope !== PermissionScope.write &&
        permissions?.templates?.scope !== PermissionScope.write &&
        permissions?.processes?.scope !== PermissionScope.write &&
        permissions?.rules?.scope !== PermissionScope.write &&
        Object.keys(permissions?.instances?.categories ?? {}).length === 0
    );
};

export const isPermissionsEquals = (currentPermissions: IUser['permissions'], newPermissions: IUser['permissions']) =>
    isEqualWith(currentPermissions, newPermissions);

export type childTemplatePermissionDialog = {
    id: string;
    name: string;
    parentTemplateId: string;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    viewType: ViewType;
};

export type entityTemplatePermissionDialog = {
    id: string;
    name: string;
    childTemplates: childTemplatePermissionDialog[];
    isParentTemplateInDifferentCategory?: boolean;
};

export type CategoryWithTemplates = IMongoCategory & {
    entityTemplates: entityTemplatePermissionDialog[];
};

export const createDialogCategories = (
    entityTemplates: (IMongoEntityTemplatePopulated & { isParentTemplateInDifferentCategory?: boolean })[],
    childTemplates: IMongoChildTemplateWithConstraintsPopulated[],
    searchText?: string,
): Map<string, CategoryWithTemplates> => {
    const dialogPermissionData: Map<string, CategoryWithTemplates> = new Map();
    const normalizedSearch = searchText?.trim().toLowerCase();

    for (const child of childTemplates) {
        const exists = entityTemplates.find(({ _id, category }) => _id === child.parentTemplate._id && category._id === child.category._id);
        if (!exists) {
            entityTemplates.push({
                ...child.parentTemplate,
                category: child.category,
                isParentTemplateInDifferentCategory: true,
            });
        }
    }

    for (const entityTemplate of entityTemplates) {
        const categoryId = entityTemplate.category._id;
        const categoryName = entityTemplate.category.displayName.toLowerCase();
        const entityName = entityTemplate.displayName.toLowerCase();

        const matchedChildTemplates: entityTemplatePermissionDialog['childTemplates'] = [];

        for (const child of childTemplates) {
            if (child.category._id === categoryId && child.parentTemplate._id === entityTemplate._id) {
                const childName = child.displayName.toLowerCase();
                if (!normalizedSearch || childName.includes(normalizedSearch)) {
                    matchedChildTemplates.push({
                        id: child._id,
                        name: child.displayName,
                        isFilterByCurrentUser: child.isFilterByCurrentUser,
                        isFilterByUserUnit: child.isFilterByUserUnit,
                        viewType: child.viewType,
                        parentTemplateId: child.parentTemplate._id,
                    });
                }
            }
        }

        const categoryMatches = !normalizedSearch || categoryName.includes(normalizedSearch);
        const entityMatches = !normalizedSearch || entityName.includes(normalizedSearch);
        const shouldIncludeEntity = categoryMatches || entityMatches || matchedChildTemplates.length > 0;

        if (!shouldIncludeEntity) continue;

        const fullChildTemplates = categoryMatches
            ? childTemplates
                  .filter((child) => child.category._id === categoryId && child.parentTemplate._id === entityTemplate._id)
                  .map((child) => ({
                      id: child._id,
                      name: child.displayName,
                      isFilterByCurrentUser: child.isFilterByCurrentUser,
                      isFilterByUserUnit: child.isFilterByUserUnit,
                      viewType: child.viewType,
                      parentTemplateId: child.parentTemplate._id,
                  }))
            : matchedChildTemplates;

        const displayEntity: entityTemplatePermissionDialog = {
            id: entityTemplate._id,
            name: entityTemplate.displayName,
            childTemplates: fullChildTemplates,
            isParentTemplateInDifferentCategory: entityTemplate.isParentTemplateInDifferentCategory,
        };

        const existingCategory = dialogPermissionData.get(categoryId);
        const updatedCategory: CategoryWithTemplates = {
            ...entityTemplate.category,
            entityTemplates: existingCategory ? [...existingCategory.entityTemplates, displayEntity] : [displayEntity],
        };

        dialogPermissionData.set(categoryId, updatedCategory);
    }

    return dialogPermissionData;
};
