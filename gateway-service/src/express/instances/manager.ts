import { deleteFiles, duplicateFiles, uploadFiles } from '../../externalServices/storageService';
import { IEntity, InstanceManagerService, IRelationship } from '../../externalServices/instanceManager';
import { EntityTemplateManagerService, IEntityTemplatePopulated } from '../../externalServices/entityTemplateManager';
import { ActivityLogManagerService } from '../../externalServices/activityLogManager';
import { trycatch } from '../../utils';

export class InstancesManager {
    private static async uploadInstanceFiles(files: Express.Multer.File[]) {
        if (files.length === 0) {
            return {};
        }

        const fileIds = await uploadFiles(files);

        const filePropertiesEntries = files.map((file, index) => {
            return [file.fieldname, fileIds[index]];
        });

        return Object.fromEntries(filePropertiesEntries);
    }

    private static getFilePropertiesKeysByTemplate(template: IEntityTemplatePopulated) {
        const filePropertiesEntries = Object.entries(template.properties.properties).filter(([_key, value]) => value.format === 'fileId');
        return filePropertiesEntries.map(([key]) => key);
    }

    private static getCurrentEntityFilesEntries(entityProperties: object, fileProperties: string[]) {
        return Object.entries(entityProperties).filter(([key]) => fileProperties.includes(key));
    }

    static async createEntityInstance(instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const fileProperties = await InstancesManager.uploadInstanceFiles(files);
        const entity = await InstanceManagerService.createEntityInstance({
            templateId: instanceData.templateId,
            properties: { ...fileProperties, ...instanceData.properties },
        });

        await ActivityLogManagerService.createActivityLog({
            action: 'CREATE_ENTITY',
            entityId: entity.properties._id,
            metadata: {},
            timestamp: new Date(),
            userId: user.id,
        });
        return entity;
    }

    private static async deleteUnusedFiles(currentEntity: IEntity, instanceData: IEntity, files: Express.Multer.File[]) {
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);
        const newFilesKeys = files.map((file) => file.fieldname);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);
        const filesEntries = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);

        const filesEntriesToDelete = filesEntries.filter(([key]) => {
            return !instanceData.properties[key] || newFilesKeys[key];
        });

        const filesToDelete = filesEntriesToDelete.map(([_key, value]) => value);

        if (filesToDelete.length === 0) {
            return [];
        }

        return deleteFiles(filesToDelete);
    }

    static async updateEntityStatus(id: string, disabled: boolean, user: Express.User) {
        const entity = await InstanceManagerService.updateEntityStatus(id, disabled);

        await ActivityLogManagerService.createActivityLog({
            action: disabled ? 'DISABLE_ENTITY' : 'ACTIVATE_ENTITY',
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId: user.id,
        });
        return entity;
    }

    static async duplicateEntityInstance(id: string, instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const uploadedFilesProperties = await InstancesManager.uploadInstanceFiles(files);

        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);
        const currentEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(currentEntityTemplate);
        const filesEntries = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);

        const filesEntriesToDuplicate = filesEntries.filter(([_key, value]) => Object.values(instanceData.properties).includes(value));

        const duplicatedFiles = await duplicateFiles(filesEntriesToDuplicate.map(([_key, value]) => value));

        const duplicatedFilesEntries = filesEntriesToDuplicate.map(([key], index) => [key, duplicatedFiles[index].path]);

        const duplicatedFilesEntriesProperties = Object.fromEntries(duplicatedFilesEntries);

        const entity = await InstanceManagerService.createEntityInstance({
            templateId: instanceData.templateId,
            properties: { ...uploadedFilesProperties, ...instanceData.properties, ...duplicatedFilesEntriesProperties },
        });

        await ActivityLogManagerService.createActivityLog({
            action: 'CREATE_ENTITY',
            entityId: entity.properties._id,
            metadata: {},
            timestamp: new Date(),
            userId: user.id,
        });

        return entity;
    }

    static async updateEntityInstance(id: string, instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const uploadedFilesProperties = await InstancesManager.uploadInstanceFiles(files);

        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);

        const updatedInstace = await InstanceManagerService.updateEntityInstance(id, {
            templateId: instanceData.templateId,
            properties: { ...uploadedFilesProperties, ...instanceData.properties },
        });
        const { err } = await trycatch(() => InstancesManager.deleteUnusedFiles(currentEntity, instanceData, files));

        if (err) {
            console.log(`failed to delete files of instanceId ${id}`);
        }

        const updateInfo = { entityId: instanceData.properties._id, timestamp: new Date(), userId: user.id };
        if (currentEntity.properties.disabled === updatedInstace.properties.disabled) {
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

            const updatedFieldsNames = Object.keys(entityTemplate.properties.properties).filter(
                (key) => currentEntity.properties[key] !== updatedInstace.properties[key],
            );

            const updatedFields = updatedFieldsNames.map((fieldName) => {
                return {
                    fieldName,
                    oldValue: currentEntity.properties[fieldName] || null,
                    newValue: updatedInstace.properties[fieldName] || null,
                };
            });

            await ActivityLogManagerService.createActivityLog({
                action: 'UPDATE_ENTITY',
                metadata: { updatedFields },
                ...updateInfo,
            });
        } else {
            await ActivityLogManagerService.createActivityLog({
                action: updatedInstace.properties.disabled ? 'DISABLE_ENTITY' : 'ACTIVATE_ENTITY',
                metadata: {},
                ...updateInfo,
            });
        }

        return updatedInstace;
    }

    private static async deleteAllEntityFiles(currentEntity: IEntity) {
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);
        const filesEntriesToRemove = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);
        const fileIdsToRemove = filesEntriesToRemove.map(([, value]) => value);

        if (fileIdsToRemove.length === 0) {
            return [];
        }

        return deleteFiles(fileIdsToRemove);
    }

    static async deleteEntityInstance(id: string) {
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);
        const deletedInstance = await InstanceManagerService.deleteEntityInstance(id);

        const { err } = await trycatch(() => InstancesManager.deleteAllEntityFiles(currentEntity));

        if (err) {
            console.log(`failed to delete files of instanceId ${id}`);
        }

        return deletedInstance;
    }

    static async createRelationshipInstance(relationship: IRelationship, user: Express.User) {
        const createdRelationship = await InstanceManagerService.createRelationshipInstance(relationship);

        const updatedFields: {
            action: 'CREATE_RELATIONSHIP';
            timestamp: Date;
            userId: string;
            metadata: {
                relationshipTemplateId: string;
                relationshipId: string;
            };
        } = {
            action: 'CREATE_RELATIONSHIP',
            timestamp: new Date(),
            userId: user.id,
            metadata: {
                relationshipTemplateId: createdRelationship.templateId,
                relationshipId: createdRelationship.properties._id,
            },
        };

        await ActivityLogManagerService.createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.destinationEntityId },
        });
        await ActivityLogManagerService.createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.sourceEntityId },
        });

        return createdRelationship;
    }

    static async deleteRelationshipInstance(relationshipId: string, user: Express.User) {
        const relationship = await InstanceManagerService.deleteRelationshipInstance(relationshipId);

        const updatedFields: {
            action: 'DELETE_RELATIONSHIP';
            timestamp: Date;
            userId: string;
            metadata: {
                relationshipTemplateId: string;
                relationshipId: string;
            };
        } = {
            action: 'DELETE_RELATIONSHIP',
            timestamp: new Date(),
            userId: user.id,
            metadata: {
                relationshipTemplateId: relationship.templateId,
                relationshipId: relationship.properties._id,
            },
        };

        await ActivityLogManagerService.createActivityLog({
            ...updatedFields,
            entityId: relationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: relationship.destinationEntityId },
        });
        await ActivityLogManagerService.createActivityLog({
            ...updatedFields,
            entityId: relationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: relationship.sourceEntityId },
        });

        return relationship;
    }
}

export default InstancesManager;
