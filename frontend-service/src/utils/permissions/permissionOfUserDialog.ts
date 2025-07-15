import isEqualWith from 'lodash.isequalwith';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoChildTemplatePopulated, ViewType } from '../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

export const userHasNoPermissions = (permissions: ISubCompactPermissions) => {
    return (
        permissions?.permissions?.scope !== PermissionScope.write &&
        permissions?.templates?.scope !== PermissionScope.write &&
        permissions?.processes?.scope !== PermissionScope.write &&
        permissions?.rules?.scope !== PermissionScope.write &&
        Object.keys(permissions?.instances?.categories ?? {}).length === 0
    );
};

export const didPermissionsChange = (currentPermissions: IUser['permissions'], newPermissions: IUser['permissions']) =>
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
    entityTemplates: IMongoEntityTemplatePopulated[],
    childTemplates: IMongoChildTemplatePopulated[],
): Map<string, CategoryWithTemplates> => {
    const dialogPermissionData: ReturnType<typeof createDialogCategories> = new Map();

    for (const child of childTemplates) {
        if (!entityTemplates.find(({ _id, category }) => _id === child.parentTemplate._id && category._id === child.category._id)) {
            entityTemplates.push({ ...child.parentTemplate, category: child.category });
        }
    }

    for (const entityTemplate of entityTemplates) {
        const category: CategoryWithTemplates = {
            entityTemplates: dialogPermissionData.get(entityTemplate.category._id)?.entityTemplates || [],
            ...entityTemplate.category,
        };

        const displayEntity: entityTemplatePermissionDialog = {
            id: entityTemplate._id,
            name: entityTemplate.displayName,
            childTemplates: [],
        };

        for (const child of childTemplates) {
            if (child.category._id === entityTemplate.category._id) {
                const childTemplate: childTemplatePermissionDialog = {
                    id: child._id,
                    name: child.displayName,
                    isFilterByCurrentUser: child.isFilterByCurrentUser,
                    isFilterByUserUnit: child.isFilterByUserUnit,
                    viewType: child.viewType,
                    parentTemplateId: child.parentTemplate._id,
                };

                if (child.parentTemplate._id === entityTemplate._id) {
                    displayEntity.childTemplates.push(childTemplate);
                } else if (category.entityTemplates.find(({ id }) => id !== child.parentTemplate._id)) {
                    category.entityTemplates.push({
                        id: child.parentTemplate._id,
                        name: child.parentTemplate.displayName,
                        childTemplates: [childTemplate],
                        isParentTemplateInDifferentCategory: true,
                    });
                }
            }
        }

        category.entityTemplates.push(displayEntity);
        dialogPermissionData.set(entityTemplate.category._id, category);
    }

    return dialogPermissionData;
};
