/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { promises as fsp } from 'fs';
import axios from 'axios';
import { stream } from 'exceljs';
import { deleteFiles, duplicateFiles, uploadFiles } from '../../externalServices/storageService';
import { IEntity, ISearchFilter, ISearchSort } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IExportEntitiesBody } from './interfaces';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { EntityTemplateManagerService, IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../externalServices/entityTemplateService';
import { ActivityLogManagerService, IUpdatedFields } from '../../externalServices/activityLogService';
import { trycatch } from '../../utils';
import {
    ActionTypes,
    IBrokenRule,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IUpdateEntityMetadata,
    IUpdateEntityStatusMetadata,
} from '../../externalServices/ruleBreachService/interfaces';
import RuleBreachesManager from '../ruleBreaches/manager';
import config from '../../config';
import { ServiceError } from '../error';
import { cerateWorksheet, createWorkbook, fixFileProperties, styleAWorksheet } from '../../utils/excel/excelFunctions';

const { errorCodes } = config;

export class InstancesManager {
    static async uploadInstanceFiles(files: Express.Multer.File[]): Promise<Record<string, string>> {
        if (files.length === 0) {
            return {};
        }

        const fileIds = await uploadFiles(files);
        const filePropertiesEntries = files.map((file, index) => {
            return [file.fieldname, fileIds[index]];
        });

        const filesToUpload: any = {};
        //not for image picker
        Object.entries(Object.fromEntries(filePropertiesEntries)).forEach(([key, value]) => {
            const [group, _index] = key.split('.');
            if (group === key) {
                //for single files
                filesToUpload[key] = value;
            } else {
                if (!filesToUpload[group]) {
                    filesToUpload[group] = [];
                }
                filesToUpload[group].push(value);
            }
        });

        return filesToUpload;
    }

    static async exportEntities(exportEntitiesBody: IExportEntitiesBody) {
        const { workbook, filePath } = await createWorkbook(exportEntitiesBody.fileName);
        try {
            await this.addWorksheetsToWB(exportEntitiesBody, workbook);
            await workbook.commit();
        } catch (err) {
            await fsp.unlink(filePath);
            throw err;
        }
        return filePath;
    }

    private static async addWorksheetsToWB({ templates, textSearch }: IExportEntitiesBody, workbook: stream.xlsx.WorkbookWriter): Promise<void> {
        const tasks = Object.entries(templates).map(async ([templateId, { filter, sort }]) => {
            const template = await EntityTemplateManagerService.getEntityTemplateById(templateId);
            await this.createWorksheet(workbook, template, filter, sort, textSearch);
        });

        await Promise.all(tasks);
    }

    private static async createWorksheet(
        workbook: stream.xlsx.WorkbookWriter,
        template: IMongoEntityTemplatePopulated,
        filter: ISearchFilter | undefined,
        sort: ISearchSort | undefined,
        textSearch: string | undefined,
    ) {
        const worksheet = await cerateWorksheet(workbook, template);
        const { searchEntitiesChunkSize } = config.service;
        const { count } = await InstanceManagerService.searchEntitiesOfTemplateRequest(template._id, {
            limit: 1,
            filter,
            sort,
        });
        for (let skip = 0; count - skip > 0; skip += searchEntitiesChunkSize) {
            const { entities: chunk } = await InstanceManagerService.searchEntitiesOfTemplateRequest(template._id, {
                skip,
                limit: searchEntitiesChunkSize,
                textSearch,
                filter,
                sort,
            });
            const rows = fixFileProperties(
                chunk.map((row) => row.entity.properties),
                template,
            );

            rows.forEach((row) => {
                const excelRow = worksheet.addRow(row);
                styleAWorksheet(worksheet);
                excelRow.commit();
            });
        }
    }

    static getFilePropertiesKeysByTemplate(template: IEntityTemplatePopulated) {
        const filePropertiesEntries = Object.entries(template.properties.properties).filter(([_key, value]) => value.format === 'fileId');
        return filePropertiesEntries.map(([key]) => key);
    }

    private static getCurrentEntityFilesEntries(entityProperties: object, fileProperties: string[]) {
        return Object.entries(entityProperties).filter(([key]) => fileProperties.includes(key));
    }

    static async createEntityInstance(instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const fileProperties = await InstancesManager.uploadInstanceFiles(files);

        const filesToUpload: any = {};
        //not for image picker
        Object.entries(fileProperties).forEach(([key, value]) => {
            const [group, _index] = key.split('.');
            if (group === key) {
                //for single files
                filesToUpload[key] = value;
            } else {
                if (!filesToUpload[group]) {
                    filesToUpload[group] = [];
                }
                filesToUpload[group].push(value);
            }
        });

        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(instanceData.templateId);
        let templateUpdated = false;

        const updatedProperties = {
            ...entityTemplate.properties.properties,
        };
        const newInstanceData: IEntity = { templateId: instanceData.templateId, properties: { ...filesToUpload, ...instanceData.properties } };

        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                newInstanceData.properties[key] = Number(entityTemplate.properties.properties[key].serialCurrent);

                const serialNum: number = Number(entityTemplate.properties.properties[key].serialCurrent) + 1;
                const newSerialNumberObj = { ...entityTemplate.properties.properties[key], serialCurrent: serialNum };
                updatedProperties[key] = newSerialNumberObj;
                templateUpdated = true;
            }
        });

        if (templateUpdated) {
            const { category, _id, createdAt, updatedAt, disabled, ...restOfEntityTemplate } = entityTemplate;
            await EntityTemplateManagerService.updateEntityTemplate(instanceData.templateId, {
                ...restOfEntityTemplate,
                category: category._id,
                properties: {
                    ...entityTemplate.properties,
                    properties: updatedProperties,
                },
            });
        }

        const entity = await InstanceManagerService.createEntityInstance(newInstanceData);

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

    static async updateEntityStatus(id: string, disabledStatus: boolean, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const entity = await InstanceManagerService.updateEntityStatus(id, disabledStatus, ignoredRules).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert<IUpdateEntityStatusMetadata>(
                {
                    brokenRules: ignoredRules,
                    actionType: ActionTypes.UpdateStatus,
                    actionMetadata: {
                        entityId: id,
                        disabled: disabledStatus,
                    },
                },
                userId,
            );
        }

        await ActivityLogManagerService.createActivityLog({
            action: disabledStatus ? 'DISABLE_ENTITY' : 'ACTIVATE_ENTITY',
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId,
        });
        return entity;
    }

    static async duplicateEntityInstance(id: string, instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);
        const currentEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);
        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(currentEntityTemplate);
        const filesEntries = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);
        const filesEntriesToDuplicate = filesEntries.filter(([_key, value]) => Object.values(instanceData.properties).includes(value));

        const duplicatedFiles = await duplicateFiles(filesEntriesToDuplicate.map(([_key, value]) => value));

        const duplicatedFilesEntries = filesEntriesToDuplicate.map(([key], index) => [key, duplicatedFiles[index].path]);

        const duplicatedFilesEntriesProperties = Object.fromEntries(duplicatedFilesEntries);

        const duplicatedInstanceData: IEntity = {
            templateId: instanceData.templateId,
            properties: { ...instanceData.properties, ...duplicatedFilesEntriesProperties },
        };

        return this.createEntityInstance(duplicatedInstanceData, files, user);
    }

    static async updateEntityInstance(
        id: string,
        updatedInstanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        createAlert: boolean = true,
    ) {
        const uploadedFilesProperties = await InstancesManager.uploadInstanceFiles(files);
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);

        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                if (updatedInstanceData.properties[key] !== currentEntity.properties[key]) {
                    throw new ServiceError(400, "can't change serial properties");
                }
            }
        });
        if (uploadedFilesProperties?.files) {
            updatedInstanceData.properties.files = uploadedFilesProperties.files;
        }
        const updatedInstance = await InstanceManagerService.updateEntityInstance(
            id,
            {
                templateId: updatedInstanceData.templateId,
                properties: { ...uploadedFilesProperties, ...updatedInstanceData.properties },
            },
            ignoredRules,
        ).catch(InstancesManager.handleBrokenRulesError);

        await InstancesManager.deleteUnusedFiles(currentEntity, updatedInstanceData, files).catch(() =>
            console.log(`failed to delete files of instanceId ${id}`),
        );

        const updatedFields: Record<string, any> = {};
        const activityLogUpdatedFields: IUpdatedFields[] = [];

        const fields = Object.keys(entityTemplate.properties.properties);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const propertyTemplate = entityTemplate.properties.properties[field];

            let newValue: any;
            if (propertyTemplate?.format === 'fileId' || propertyTemplate?.items?.format === 'fileId') {
                newValue = uploadedFilesProperties[field] ?? updatedInstance.properties[field];
            } else {
                newValue = updatedInstance.properties[field];
            }
            if (
                newValue !== undefined &&
                Array.isArray(currentEntity.properties[field]) &&
                newValue.length === currentEntity.properties[field].length &&
                newValue.every((element, index) => element === currentEntity.properties[field][index])
            )
                continue;
            if (currentEntity.properties[field] === newValue) continue;
            updatedFields[field] = newValue ?? null;
            activityLogUpdatedFields.push({
                fieldName: field,
                oldValue: currentEntity.properties[field] ?? null,
                newValue: newValue ?? null,
            });
        }

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert<IUpdateEntityMetadata>(
                {
                    brokenRules: ignoredRules,
                    actionType: ActionTypes.UpdateEntity,
                    actionMetadata: {
                        entityId: id,
                        before: currentEntity.properties,
                        updatedFields,
                    },
                },
                userId,
            );
        }
        await ActivityLogManagerService.createActivityLog({
            action: 'UPDATE_ENTITY',
            metadata: { updatedFields: activityLogUpdatedFields },
            entityId: updatedInstanceData.properties._id,
            timestamp: new Date(),
            userId,
        });

        return updatedInstance;
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
            // eslint-disable-next-line no-console
            console.log(`failed to delete files of instanceId ${id}`);
        }

        return deletedInstance;
    }

    static async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const createdRelationship = await InstanceManagerService.createRelationshipInstance(relationship, ignoredRules).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert<ICreateRelationshipMetadata>(
                {
                    brokenRules: ignoredRules,
                    actionType: ActionTypes.CreateRelationship,
                    actionMetadata: {
                        relationshipTemplateId: relationship.templateId,
                        sourceEntityId: relationship.sourceEntityId,
                        destinationEntityId: relationship.destinationEntityId,
                    },
                },
                userId,
            );
        }

        const updatedFields = {
            action: 'CREATE_RELATIONSHIP' as const,
            timestamp: new Date(),
            userId,
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

    static async deleteRelationshipInstance(relationshipId: string, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const relationship = await InstanceManagerService.deleteRelationshipInstance(relationshipId, ignoredRules).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert<IDeleteRelationshipMetadata>(
                {
                    brokenRules: ignoredRules,
                    actionType: ActionTypes.DeleteRelationship,
                    actionMetadata: {
                        relationshipTemplateId: relationship.templateId,
                        relationshipId: relationship.properties._id,
                        sourceEntityId: relationship.sourceEntityId,
                        destinationEntityId: relationship.destinationEntityId,
                    },
                },
                userId,
            );
        }

        const updatedFields = {
            action: 'DELETE_RELATIONSHIP' as const,
            timestamp: new Date(),
            userId,
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

    static async handleBrokenRulesError(error: any): Promise<never> {
        if (axios.isAxiosError(error) && error.response?.data.metadata?.errorCode === errorCodes.ruleBlock) {
            const { brokenRules } = error.response.data.metadata;

            throw new ServiceError(400, error.message, {
                errorCode: errorCodes.ruleBlock,
                brokenRules: await RuleBreachesManager.populateBrokenRules(brokenRules),
                rawBrokenRules: brokenRules,
            });
        }

        throw error;
    }
}
