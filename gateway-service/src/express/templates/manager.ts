import * as lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService, ISearchEntityTemplatesBody } from '../../externalServices/entityTemplateManager';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import PermissionsManager from '../permissions/manager';

export class TemplatesManager {
    // get all entityTemplates that are one relationship (step) away  from the original users permissions
    private static getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
        allowedRelationshipsTemplatesBySource: IRelationshipTemplate[],
        allowedRelationshipsTemplatesByDestination: IRelationshipTemplate[],
        allowedEntityTemplatesIds: string[],
    ) {
        const extendedAllowedRelationshipsTemplatesIds = new Set<string>();

        allowedRelationshipsTemplatesBySource.forEach((relationshipTemplate: IRelationshipTemplate) => {
            const { destinationEntityId } = relationshipTemplate;

            if (!allowedEntityTemplatesIds.includes(destinationEntityId)) {
                extendedAllowedRelationshipsTemplatesIds.add(destinationEntityId);
            }
        });

        allowedRelationshipsTemplatesByDestination.forEach((relationshipTemplate: IRelationshipTemplate) => {
            const { sourceEntityId } = relationshipTemplate;

            if (!allowedEntityTemplatesIds.includes(sourceEntityId)) {
                extendedAllowedRelationshipsTemplatesIds.add(sourceEntityId);
            }
        });

        return Array.from(extendedAllowedRelationshipsTemplatesIds);
    }

    // all
    static async getAllAllowedTemplates(userId: string) {
        const allCategories = await TemplatesManager.getAllCategories();

        const allowedEntityTemplates = await TemplatesManager.getAllowedEntitiesTemplates(userId);
        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const allowedRelationshipsTemplatesBySource = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            sourceEntityIds: allowedEntityTemplatesIds,
        });
        const allowedRelationshipsTemplatesByDestination = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            destinationEntityIds: allowedEntityTemplatesIds,
        });
        const allowedRelationshipsTemplates = lodashUniqby(
            [...allowedRelationshipsTemplatesByDestination, ...allowedRelationshipsTemplatesBySource],
            '_id',
        );

        const extendedAllowedRelationshipsTemplatesIds = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            allowedRelationshipsTemplatesBySource,
            allowedRelationshipsTemplatesByDestination,
            allowedEntityTemplatesIds,
        );

        const allowedEntityTemplatesByOneRelationship = await EntityTemplateManagerService.searchEntityTemplates({
            ids: extendedAllowedRelationshipsTemplatesIds,
        });

        return {
            categories: allCategories,
            entityTemplates: [...allowedEntityTemplates, ...allowedEntityTemplatesByOneRelationship],
            relationshipTemplates: allowedRelationshipsTemplates,
        };
    }

    // categories
    static async getAllCategories() {
        return EntityTemplateManagerService.getAllCategories();
    }

    // entities
    static async getAllowedEntitiesTemplates(userId: string) {
        const searchBody: ISearchEntityTemplatesBody = {};

        const userPermissions = await PermissionsManager.getPermissionsOfUser(userId);
        const { templatesManagementId, instancesPermissions } = userPermissions;

        if (!templatesManagementId) {
            const allowedCategories = instancesPermissions.map((permission) => permission.category);

            searchBody.categoryIds = allowedCategories;
        }

        return EntityTemplateManagerService.searchEntityTemplates(searchBody);
    }
}

export default TemplatesManager;
