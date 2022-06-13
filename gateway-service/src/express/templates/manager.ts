import { AxiosError } from 'axios';
import * as lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService, ICategory, IEntityTemplate, ISearchEntityTemplatesBody } from '../../externalServices/entityTemplateManager';
import { InstanceManagerService } from '../../externalServices/instanceManager';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { trycatch } from '../../utils';
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

    // TODO: race condition here
    static async deleteCategory(id: string) {
        const templates = await EntityTemplateManagerService.searchEntityTemplates({ categoryIds: [id] });
        if (templates.length > 0) {
            throw new ServiceError(400, 'category still has entity templates');
        }

        const category = await EntityTemplateManagerService.getCategoryById(id);

        // deleting first the category so if it will fail, the icon and the permissions wont be deleted
        await EntityTemplateManagerService.deleteCategory(id);

        if (category.iconFileId !== null) {
            await trycatch(() => deleteFile(category.iconFileId!));
        }

        await trycatch(() => PermissionsManager.deletePermissionsOfCategory(id));
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

    // entity templates
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
            throw new ServiceError(400, 'entity template still has outgoing relationships');
        }
        const incomingRelationships = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [id] });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(400, 'entity template still has incoming relationships');
        }
    }

    static async throwIfEntityTemplateHasInstances(id: string) {
        const { rows } = await InstanceManagerService.getInstancesByTemplateId(id, { startRow: 0, endRow: 0, sortModel: [], filterModel: {} });
        if (rows.length !== 0) {
            throw new ServiceError(400, 'entity template still has instances');
        }
    }

    static async deleteEntityTemplate(id: string) {
        await TemplatesManager.throwIfEntityHasRelationships(id);
        await TemplatesManager.throwIfEntityTemplateHasInstances(id);

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

        const { rows } = await InstanceManagerService.getInstancesByTemplateId(id, { startRow: 0, endRow: 0, sortModel: [], filterModel: {} });
        const currTemplate = await EntityTemplateManagerService.getEntityTemplateById(id);

        if (rows.length > 0) {
            if (updatedTemplate.category) {
                await EntityTemplateManagerService.getCategoryById(updatedTemplate.category);
            }

            if (updatedTemplate.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');

            Object.entries(currTemplate.properties.properties).forEach(([key, value]) => {
                const newValue = updatedTemplate.properties?.properties[key];
                if (!newValue) throw new ServiceError(400, 'can not remove property type');

                if (value.type !== newValue.type) throw new ServiceError(400, 'can not change property type');
                if (value.format !== newValue.format) throw new ServiceError(400, 'can not change property format');
                if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                    throw new ServiceError(400, 'can not remove options from enum');
            });

            if (updatedTemplate.properties?.required.find((propertyName) => !currTemplate.properties.required.includes(propertyName))) {
                throw new ServiceError(400, 'can not add required fields');
            }

            if (currTemplate.properties.required.find((propertyName) => !updatedTemplate.properties?.required.includes(propertyName))) {
                throw new ServiceError(400, 'can not remove required fields');
            }
        }

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

    // relationship templates
    private static async throwIfEntityTemplateDoesntExist(entityTemplateId: string, errorMessage: string) {
        const { err: getEntityErr } = await trycatch(() => EntityTemplateManagerService.getEntityTemplateById(entityTemplateId));
        if (getEntityErr) {
            const { response } = getEntityErr as AxiosError;

            if (response?.status === 404) {
                throw new ServiceError(400, errorMessage);
            }
            throw getEntityErr;
        }
    }

    static async createRelationshipTemplate(relationshipTemplate: IRelationshipTemplate) {
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        await TemplatesManager.throwIfEntityTemplateDoesntExist(sourceEntityId, 'source entity of relation doesnt exist');
        await TemplatesManager.throwIfEntityTemplateDoesntExist(destinationEntityId, 'destination entity of relation doesnt exist');

        return RelationshipsTemplateManagerService.createRelationshipTemplate(relationshipTemplate);
    }

    static async updateRelationshipTemplate(templateId: string, updatedFields: Partial<IRelationshipTemplate>) {
        if (updatedFields.sourceEntityId) {
            await TemplatesManager.throwIfEntityTemplateDoesntExist(updatedFields.sourceEntityId, 'source entity of relation doesnt exist');
        }

        if (updatedFields.destinationEntityId) {
            await TemplatesManager.throwIfEntityTemplateDoesntExist(updatedFields.destinationEntityId, 'destination entity of relation doesnt exist');
        }

        const relationshipCount = await InstanceManagerService.getRelationshipsCountByTemplateId(templateId);
        const currTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(templateId);

        if (relationshipCount > 0) {
            if (updatedFields.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');
            if (updatedFields.sourceEntityId !== currTemplate.sourceEntityId) throw new ServiceError(400, 'can not change source entity template');
            if (updatedFields.destinationEntityId !== currTemplate.destinationEntityId)
                throw new ServiceError(400, 'can not change destination entity template');
        }

        return RelationshipsTemplateManagerService.updateRelationshipTemplate(templateId, updatedFields);
    }

    static async deleteRelationshipTemplate(templateId: string) {
        const relationshipCount = await InstanceManagerService.getRelationshipsCountByTemplateId(templateId);
        if (relationshipCount !== 0) {
            throw new ServiceError(400, 'relationship template still has instances');
        }

        return RelationshipsTemplateManagerService.deleteRelationshipTemplate(templateId);
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
