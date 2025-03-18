import { PermissionScope } from '../../interfaces/permissions';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRule } from '../../interfaces/rules';

export const allowedCategories = (categories: ICategoryMap, currentUser) => {
    const allowedCategoriesToShow = currentUser.currentWorkspacePermissions?.admin
        ? Array.from(categories.keys())
        : Object.keys(currentUser.currentWorkspacePermissions?.instances?.categories ?? {});

    return allowedCategoriesToShow.map((categoryId) => categories?.get(categoryId)).filter((category) => category !== undefined);
};

export const allowedEntitiesOfCategory = (relatedEntityTemplatesToShow: IMongoEntityTemplatePopulated[], category: IMongoCategory, currentUser) => {
    if (currentUser.currentWorkspacePermissions.admin || currentUser.currentWorkspacePermissions.instances?.categories[category._id].scope)
        return relatedEntityTemplatesToShow;
    const entitiesKeys = Object.keys(currentUser.currentWorkspacePermissions.instances?.categories[category._id].entityTemplates);
    return relatedEntityTemplatesToShow.filter((entity) => entitiesKeys.includes(entity._id));
};

export const getAllAllowedEntities = (allEntityTemplates: IMongoEntityTemplatePopulated[], currentUser) => {
    return currentUser.currentWorkspacePermissions.admin
        ? allEntityTemplates
        : allEntityTemplates.filter((entity) => {
              return (
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.scope ||
                  currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.entityTemplates[entity._id]
              );
          });
};

export const getAllWritePermissionEntityTemplates = (allEntityTemplates: IMongoEntityTemplatePopulated[], currentUser) => {
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

export const getAllAllowedRulesAndWriteEntities = (rules: IMongoRule[], entityTemplates: IMongoEntityTemplatePopulated[], currentUser) => {
    if (currentUser.currentWorkspacePermissions.admin) return { allowedEntityTemplates: entityTemplates, allowedRules: rules }; // Add default structure for non-admin

    const allowedEntityTemplates = getAllAllowedEntities(entityTemplates, currentUser);
    const entityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);
    return {
        allowedEntityTemplates,
        allowedRules: rules.filter((rule) => entityTemplatesIds.includes(rule.entityTemplateId)),
    };
};
