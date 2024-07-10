/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { promises as fsp } from 'fs';
import axios from 'axios';
import { stream } from 'exceljs';
import { StorageService } from '../../externalServices/storageService';
import { IEntity, ISearchFilter, ISearchSort } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IExportEntitiesBody } from './interfaces';
import { InstancesService } from '../../externalServices/instanceService';
import { EntityTemplateService, IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../externalServices/entityTemplateService';
import { ActivityLogService, IUpdatedFields } from '../../externalServices/activityLogService';
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
import DefaultManagerProxy from '../../utils/express/manager';

const { errorCodes } = config;

export class InstancesManager extends DefaultManagerProxy<InstancesService> {
    private entityTemplateService: EntityTemplateService;

    private activityLogService: ActivityLogService;

    private storageService: StorageService;

    private ruleBreachesManager: RuleBreachesManager;

    private instancesManager: InstancesManager;

    constructor(dbName: string) {
        super(new InstancesService(dbName));
        this.entityTemplateService = new EntityTemplateService(dbName);
        this.activityLogService = new ActivityLogService(dbName);
        this.storageService = new StorageService(dbName);
        this.ruleBreachesManager = new RuleBreachesManager(dbName);
        this.instancesManager = new InstancesManager(dbName);
    }

    async uploadInstanceFiles<TProps = Record<string, any>>(
        files: Express.Multer.File[],
        props: TProps = {} as TProps,
    ): Promise<{ props: TProps; files: Record<string, any> }> {
        if (files.length === 0) {
            return { props, files: {} };
        }

        const fileIds = await this.storageService.uploadFiles(files);
        const filePropertiesEntries = files.map((file, index) => {
            return [file.fieldname, fileIds[index]];
        });

        const filesToUpload: Record<string, any> = {};
        // not for image picker
        Object.entries(Object.fromEntries(filePropertiesEntries)).forEach(([key, value]) => {
            const [group, _index] = key.split('.');
            if (group === key) {
                // for single files
                filesToUpload[key] = value;
            } else {
                if (!filesToUpload[group]) {
                    filesToUpload[group] = [];
                }
                filesToUpload[group].push(value);
            }
        });

        Object.keys(filesToUpload).forEach((key) => {
            if (props?.[key] != undefined) {
                if (Array.isArray(props[key])) {
                    props[key] = [...props[key], ...filesToUpload[key]];
                } else {
                    props[key] = [props[key], ...filesToUpload[key]];
                }
            } else if (props) {
                props[key] = filesToUpload[key];
            }
        });
        return { props, files: filesToUpload };
    }

    async exportEntities(exportEntitiesBody: IExportEntitiesBody) {
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

    private async addWorksheetsToWB({ templates, textSearch }: IExportEntitiesBody, workbook: stream.xlsx.WorkbookWriter): Promise<void> {
        const tasks = Object.entries(templates).map(async ([templateId, { filter, sort }]) => {
            const template = await this.entityTemplateService.getEntityTemplateById(templateId);
            await this.createWorksheet(workbook, template, filter, sort, textSearch);
        });

        await Promise.all(tasks);
    }

    private async createWorksheet(
        workbook: stream.xlsx.WorkbookWriter,
        template: IMongoEntityTemplatePopulated,
        filter: ISearchFilter | undefined,
        sort: ISearchSort | undefined,
        textSearch: string | undefined,
    ) {
        const worksheet = await cerateWorksheet(workbook, template);
        const { searchEntitiesChunkSize } = config.service;
        const { count } = await this.service.searchEntitiesOfTemplateRequest(template._id, {
            limit: 1,
            filter,
            sort,
        });
        for (let skip = 0; count - skip > 0; skip += searchEntitiesChunkSize) {
            const { entities: chunk } = await this.service.searchEntitiesOfTemplateRequest(template._id, {
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

    async createEntityInstance(instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const { props: fileProperties } = await this.uploadInstanceFiles(files, instanceData.properties);
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(instanceData.templateId);
        let templateUpdated = false;

        const updatedProperties = {
            ...entityTemplate.properties.properties,
        };
        const newInstanceData: IEntity = { templateId: instanceData.templateId, properties: { ...fileProperties } };

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
            await this.entityTemplateService.updateEntityTemplate(instanceData.templateId, {
                ...restOfEntityTemplate,
                category: category._id,
                properties: {
                    ...entityTemplate.properties,
                    properties: updatedProperties,
                },
            });
        }

        const entity = await this.service.createEntityInstance(newInstanceData);

        await this.activityLogService.createActivityLog({
            action: 'CREATE_ENTITY',
            entityId: entity.properties._id,
            metadata: {},
            timestamp: new Date(),
            userId: user.id,
        });
        return entity;
    }

    private async deleteUnusedFiles(currentEntity: IEntity, instanceData: IEntity, files: Express.Multer.File[]) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);
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

        return this.storageService.deleteFiles(filesToDelete);
    }

    async updateEntityStatus(id: string, disabledStatus: boolean, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const entity = await this.service
            .updateEntityStatus(id, disabledStatus, ignoredRules)
            .catch((err) => this.instancesManager.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert<IUpdateEntityStatusMetadata>(
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

        await this.activityLogService.createActivityLog({
            action: disabledStatus ? 'DISABLE_ENTITY' : 'ACTIVATE_ENTITY',
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId,
        });
        return entity;
    }

    async duplicateEntityInstance(id: string, instanceData: IEntity, files: Express.Multer.File[], user: Express.User) {
        const currentEntity = await this.service.getEntityInstanceById(id);
        const currentEntityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);
        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(currentEntityTemplate);
        const filesEntries = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);
        const filesEntriesToDuplicate = filesEntries.filter(([_key, value]) => Object.values(instanceData.properties).includes(value));

        const duplicatedFiles = await this.storageService.duplicateFiles(filesEntriesToDuplicate.map(([_key, value]) => value));

        const duplicatedFilesEntries = filesEntriesToDuplicate.map(([key], index) => [key, duplicatedFiles[index].path]);

        const duplicatedFilesEntriesProperties = Object.fromEntries(duplicatedFilesEntries);

        const duplicatedInstanceData: IEntity = {
            templateId: instanceData.templateId,
            properties: { ...instanceData.properties, ...duplicatedFilesEntriesProperties },
        };

        return this.createEntityInstance(duplicatedInstanceData, files, user);
    }

    async viewEntityInstance(id: string, userId: string) {
        await this.activityLogService.createActivityLog({
            action: 'VIEW_ENTITY',
            entityId: id,
            metadata: {},
            timestamp: new Date(),
            userId,
        });
    }

    async updateEntityInstance(
        id: string,
        updatedInstanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        createAlert: boolean = true,
    ) {
        const { props: uploadedFilesAndProperties } = await this.uploadInstanceFiles(files, updatedInstanceData.properties);
        const currentEntity = await this.service.getEntityInstanceById(id);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                if (updatedInstanceData.properties[key] !== currentEntity.properties[key]) {
                    throw new ServiceError(400, "can't change serial properties");
                }
            }
        });

        const updatedInstance = await this.service
            .updateEntityInstance(
                id,
                {
                    templateId: updatedInstanceData.templateId,
                    properties: { ...uploadedFilesAndProperties },
                },
                ignoredRules,
            )
            .catch((err) => this.instancesManager.handleBrokenRulesError(err));
        await this.deleteUnusedFiles(currentEntity, updatedInstanceData, files).catch(() =>
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
                newValue = uploadedFilesAndProperties[field] ?? updatedInstance.properties[field];
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
            await this.ruleBreachesManager.createRuleBreachAlert<IUpdateEntityMetadata>(
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

        await this.activityLogService.createActivityLog({
            action: 'UPDATE_ENTITY',
            metadata: { updatedFields: activityLogUpdatedFields },
            entityId: updatedInstanceData.properties._id,
            timestamp: new Date(),
            userId,
        });
        return updatedInstance;
    }

    private async deleteAllEntityFiles(currentEntity: IEntity) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);
        const filesEntriesToRemove = InstancesManager.getCurrentEntityFilesEntries(currentEntity.properties, filePropertiesKeys);
        const fileIdsToRemove = filesEntriesToRemove.map(([, value]) => value);

        if (fileIdsToRemove.length === 0) {
            return [];
        }

        return this.storageService.deleteFiles(fileIdsToRemove);
    }

    async deleteEntityInstance(id: string) {
        const currentEntity = await this.service.getEntityInstanceById(id);
        const deletedInstance = await this.service.deleteEntityInstance(id);

        const { err } = await trycatch(() => this.deleteAllEntityFiles(currentEntity));

        if (err) {
            // eslint-disable-next-line no-console
            console.log(`failed to delete files of instanceId ${id}`);
        }

        return deletedInstance;
    }

    async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const createdRelationship = await this.service
            .createRelationshipInstance(relationship, ignoredRules)
            .catch((err) => this.instancesManager.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert<ICreateRelationshipMetadata>(
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

        await this.activityLogService.createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.destinationEntityId },
        });
        await this.activityLogService.createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.sourceEntityId },
        });

        return createdRelationship;
    }

    async deleteRelationshipInstance(relationshipId: string, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const relationship = await this.service
            .deleteRelationshipInstance(relationshipId, ignoredRules)
            .catch((err) => this.instancesManager.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert<IDeleteRelationshipMetadata>(
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

        await this.activityLogService.createActivityLog({
            ...updatedFields,
            entityId: relationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: relationship.destinationEntityId },
        });
        await this.activityLogService.createActivityLog({
            ...updatedFields,
            entityId: relationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: relationship.sourceEntityId },
        });

        return relationship;
    }

    async handleBrokenRulesError(error: any): Promise<never> {
        if (axios.isAxiosError(error) && error.response?.data.metadata?.errorCode === errorCodes.ruleBlock) {
            const { brokenRules } = error.response.data.metadata;

            throw new ServiceError(400, error.message, {
                errorCode: errorCodes.ruleBlock,
                brokenRules: await this.ruleBreachesManager.populateBrokenRules(brokenRules),
                rawBrokenRules: brokenRules,
            });
        }

        throw error;
    }
}
