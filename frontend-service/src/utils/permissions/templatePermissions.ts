import { PermissionScope } from '../../interfaces/permissions';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRule } from '../../interfaces/rules';
import { ICurrentUser } from '../../interfaces/users';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoChildTemplate, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';

export const allowedCategories = (categories: ICategoryMap, currentUser: ICurrentUser): IMongoCategory[] => {
    const allowedCategoriesToShow = currentUser.currentWorkspacePermissions?.admin
        ? Array.from(categories.keys())
        : Object.keys(currentUser.currentWorkspacePermissions?.instances?.categories ?? {}).sort((a, b) => {
              // this sort function is because instances?.categories is NOT NECESSARILY the showing order (the order stored in the DB under configs)
              // categories is guaranteed to be sorted, because the way it gets mapped, hence why receiving categoryOrder is redundant.
              const categoryIds = new Map(Array.from(categories.keys()).map((id, index) => [id, index]));
              return (categoryIds.get(a) ?? Infinity) - (categoryIds.get(b) ?? Infinity);
          });

    return allowedCategoriesToShow.map((categoryId) => categories?.get(categoryId)!).filter((category) => category !== undefined);
};

export const allowedEntitiesOfCategory = (
    relatedEntityTemplatesToShow: IMongoEntityTemplatePopulated[],
    category: IMongoCategory,
    currentUser: ICurrentUser,
) => {
    if (currentUser.currentWorkspacePermissions.admin || currentUser.currentWorkspacePermissions.instances?.categories[category._id].scope)
        return relatedEntityTemplatesToShow;
    const entityTemplates = currentUser.currentWorkspacePermissions.instances?.categories[category._id].entityTemplates;
    const entitiesKeys = Object.keys(entityTemplates ?? []);
    return relatedEntityTemplatesToShow.filter((entity) => entitiesKeys.includes(entity._id));
};

export const getAllAllowedEntities = (allEntityTemplates: IMongoEntityTemplatePopulated[], currentUser: ICurrentUser) => {
    return currentUser.currentWorkspacePermissions.admin
        ? allEntityTemplates
        : allEntityTemplates.filter((entity) => {
              return (
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.scope ||
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.entityTemplates[entity._id]
              );
          });
};

export const getAllWritePermissionEntityTemplates = (allEntityTemplates: IMongoEntityTemplatePopulated[], currentUser: ICurrentUser) => {
    return currentUser.currentWorkspacePermissions.admin
        ? allEntityTemplates
        : allEntityTemplates.filter((entity) => {
              return (
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.scope === PermissionScope.write ||
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.entityTemplates[entity._id]?.scope ===
                      PermissionScope.write
              );
          });
};

export const getAllAllowedRulesAndWriteEntities = (
    rules: IMongoRule[],
    entityTemplates: IMongoEntityTemplatePopulated[],
    currentUser: ICurrentUser,
) => {
    if (currentUser.currentWorkspacePermissions.admin) return { allowedEntityTemplates: entityTemplates, allowedRules: rules };

    const allowedEntityTemplates = getAllAllowedEntities(entityTemplates, currentUser);
    const entityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);
    return {
        allowedEntityTemplates,
        allowedRules: rules.filter((rule) => entityTemplatesIds.includes(rule.entityTemplateId)),
    };
};

export const getAllAllowedRelationships = (allRelationshipTemplates: IMongoRelationshipTemplate[], allowedEntityIds: string[]) => {
    return allRelationshipTemplates.filter(
        (relationshipTemplate) =>
            allowedEntityIds.includes(relationshipTemplate.sourceEntityId) && allowedEntityIds.includes(relationshipTemplate.destinationEntityId),
    );
};

export const updateUserPermissionForEntityTemplate = (
    newEntityTemplate: IMongoEntityTemplatePopulated,
    currentUser: ICurrentUser,
    workspaceId: string,
): ICurrentUser => {
    const { currentWorkspacePermissions } = currentUser;
    const { admin, instances } = currentWorkspacePermissions;
    const categoryId = newEntityTemplate.category._id;
    const categoryScope = instances?.categories?.[categoryId]?.scope;

    if (admin || categoryScope === PermissionScope.write) {
        return currentUser;
    }

    const updatedEntityTemplates = {
        ...instances?.categories?.[categoryId]?.entityTemplates,
        [newEntityTemplate._id]: { scope: PermissionScope.write, fields: {}, entityChildTemplates: {} },
    };

    const updatedCategories = {
        ...instances?.categories,
        [categoryId]: {
            scope: categoryScope,
            entityTemplates: updatedEntityTemplates,
        },
    };

    const updatedPermissions = {
        ...currentWorkspacePermissions,
        instances: {
            ...instances,
            categories: updatedCategories,
        },
    };

    return {
        ...currentUser,
        permissions: {
            ...currentUser.permissions,
            [workspaceId]: updatedPermissions,
        },
    };
};

export const updateUserPermissionForCategory = (newCategory: IMongoCategory, currentUser: ICurrentUser, workspaceId: string): ICurrentUser => {
    const { currentWorkspacePermissions } = currentUser;
    const { admin, instances } = currentWorkspacePermissions;

    if (admin) return currentUser;

    const updatedCategories = {
        ...instances?.categories,
        [newCategory._id]: { scope: PermissionScope.write, entityTemplates: {} },
    };

    const updatedPermissions = {
        ...currentWorkspacePermissions,
        instances: {
            ...instances,
            categories: updatedCategories,
        },
    };

    return {
        ...currentUser,
        permissions: {
            ...currentUser.permissions,
            [workspaceId]: updatedPermissions,
        },
    };
};

export const checkUserChildTemplatePermission = (
    userPermissions: ISubCompactPermissions,
    childTemplate: IMongoChildTemplatePopulated,
    scope: PermissionScope,
): boolean => {
    if (userPermissions.admin?.scope === PermissionScope.write) {
        return true;
    }

    const category = childTemplate.category;
    if (userPermissions.instances?.categories[category._id]?.scope === scope) {
        return true;
    }

    const categoryPermissions = userPermissions.instances?.categories[category._id];
    if (categoryPermissions && (categoryPermissions as any)?.entityChildTemplates?.[childTemplate._id]?.scope === scope) {
        return true;
    }

    return false;
};

export const checkUserChildTemplateAnyPermission = (userPermissions: ISubCompactPermissions, childTemplate: IMongoChildTemplate): boolean => {
    if (userPermissions.admin?.scope === PermissionScope.write) {
        return true;
    }

    return childTemplate.categories.some((categoryId) => {
        if (userPermissions.instances?.categories[categoryId]?.scope) {
            return true;
        }

        const categoryPermissions = userPermissions.instances?.categories[categoryId];
        if (categoryPermissions && (categoryPermissions as any)?.entityChildTemplates?.[childTemplate._id]?.scope) {
            return true;
        }

        return false;
    });
};
