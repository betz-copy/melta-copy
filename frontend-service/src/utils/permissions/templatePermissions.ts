import { PermissionScope } from '../../interfaces/permissions';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRule } from '../../interfaces/rules';
import { ICurrentUser } from '../../interfaces/users';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';

export const allowedCategories = (categories: ICategoryMap, currentUser: ICurrentUser) => {
    const allowedCategoriesToShow = currentUser.currentWorkspacePermissions?.admin
        ? Array.from(categories.keys())
        : Object.keys(currentUser.currentWorkspacePermissions?.instances?.categories ?? {});

    return allowedCategoriesToShow.map((categoryId) => categories?.get(categoryId)).filter((category) => category !== undefined);
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
