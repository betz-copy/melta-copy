import { deleteFiles, uploadFiles } from '../../externalServices/storageService';
import { IEntity, InstanceManagerService } from '../../externalServices/instanceManager';
import { EntityTemplateManagerService, IEntityTemplatePopulated } from '../../externalServices/entityTemplateManager';
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

    static async createEntityInstance(instanceData: IEntity, files: Express.Multer.File[]) {
        const fileProperties = await InstancesManager.uploadInstanceFiles(files);

        return InstanceManagerService.createEntityInstance({
            templateId: instanceData.templateId,
            properties: { ...fileProperties, ...instanceData.properties },
        });
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

    static async updateEntityInstance(id: string, instanceData: IEntity, files: Express.Multer.File[]) {
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
}

export default InstancesManager;
