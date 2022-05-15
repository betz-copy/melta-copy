import * as lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService, ICategory, IEntityTemplate, ISearchEntityTemplatesBody } from '../../externalServices/entityTemplateManager';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { removeTmpFile } from '../../utils/fs';
import { ServiceError } from '../error';
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

    static async createCategory(categoryData: Omit<ICategory, 'iconFileId'>, file?: Express.Multer.File) {
        if (file) {
            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);
            return EntityTemplateManagerService.createCategory({ ...categoryData, iconFileId: newFileId });
        }

        return EntityTemplateManagerService.createCategory({ ...categoryData, iconFileId: null });
    }

    static async deleteCategory(id: string) {
        const templates = await EntityTemplateManagerService.searchEntityTemplates({ categoryIds: [id] });
        if (templates.length > 0) {
            throw new ServiceError(403, 'category still has entity templates');
        }

        const category = await EntityTemplateManagerService.getCategoryById(id);
        if (category.iconFileId !== null) {
            await deleteFile(category.iconFileId);
        }

        return EntityTemplateManagerService.deleteCategory(id);
    }

    static async updateCategory(id: string, updatedData: Partial<ICategory> & { file?: string }, file?: Express.Multer.File) {
        const { iconFileId } = await EntityTemplateManagerService.getCategoryById(id);

        if (file) {
            if (iconFileId) {
                await deleteFile(iconFileId);
            }

            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);

            return EntityTemplateManagerService.updateCategory(id, { ...updatedData, iconFileId: newFileId });
        }

        if (iconFileId && !updatedData.iconFileId) {
            await deleteFile(iconFileId);

            return EntityTemplateManagerService.updateCategory(id, { ...updatedData, iconFileId: null });
        }

        return EntityTemplateManagerService.updateCategory(id, updatedData);
    }

    // templates
    static async createEntityTemplate(templateData: Omit<IEntityTemplate, 'iconFileId'>, file?: Express.Multer.File) {
        await EntityTemplateManagerService.getCategoryById(templateData.category);

        if (file) {
            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);
            return EntityTemplateManagerService.createEntityTemplate({ ...templateData, iconFileId: newFileId });
        }

        return EntityTemplateManagerService.createEntityTemplate({ ...templateData, iconFileId: null });
    }

    static async throwIfEntityHasRelationships(id: string) {
        const outgoingRelationships = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: [id] });
        if (outgoingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has outgoing relationships');
        }
        const incomingRelationships = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [id] });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has incoming relationships');
        }
    }

    static async deleteEntityTemplate(id: string) {
        await TemplatesManager.throwIfEntityHasRelationships(id);

        const { iconFileId } = await EntityTemplateManagerService.getEntityTemplateById(id);
        if (iconFileId) {
            await deleteFile(iconFileId);
        }

        return EntityTemplateManagerService.deleteEntityTemplate(id);
    }

    static async updateEntityTemplate(id: string, updatedTemplate: Partial<IEntityTemplate> & { file?: string }, file?: Express.Multer.File) {
        if (updatedTemplate.category) {
            await EntityTemplateManagerService.getCategoryById(updatedTemplate.category);
        }

        const { iconFileId } = await EntityTemplateManagerService.getEntityTemplateById(id);

        if (file) {
            if (iconFileId) {
                await deleteFile(iconFileId);
            }

            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);

            return EntityTemplateManagerService.updateEntityTemplate(id, { ...updatedTemplate, iconFileId: newFileId });
        }

        if (iconFileId && !updatedTemplate.iconFileId) {
            await deleteFile(iconFileId);

            return EntityTemplateManagerService.updateEntityTemplate(id, { ...updatedTemplate, iconFileId: null });
        }

        return EntityTemplateManagerService.updateEntityTemplate(id, updatedTemplate);
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
