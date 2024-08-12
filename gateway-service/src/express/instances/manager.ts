/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { promises as fsp } from 'fs';
import axios from 'axios';
import { stream } from 'exceljs';
import groupBy from 'lodash.groupby';
import { Dictionary } from 'lodash';
import { deleteFiles, duplicateFiles, uploadFiles } from '../../externalServices/storageService';
import { IEntity, ISearchFilter, ISearchSort } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IExportEntitiesBody } from './interfaces';
import { InstanceManagerService } from '../../externalServices/instanceService';
import {
    EntityTemplateManagerService,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/templates/entityTemplateService';
import { trycatch } from '../../utils';
import {
    ActionTypes,
    IAction,
    IBrokenRule,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IUpdateEntityMetadata,
} from '../../externalServices/ruleBreachService/interfaces';
import RuleBreachesManager from '../ruleBreaches/manager';
import config from '../../config';
import { ServiceError } from '../error';
import { cerateWorksheet, createWorkbook, fixComplexProperties, styleAWorksheet } from '../../utils/excel/excelFunctions';
import { objectFilter } from '../../utils/object';
import logger from '../../utils/logger/logsLogger';

const { errorCodes } = config;

export class InstancesManager {
    static async uploadInstanceFiles(files: Express.Multer.File[], props: any): Promise<any> {
        if (files.length === 0) {
            return { props, files };
        }

        const fileIds = await uploadFiles(files);
        const filePropertiesEntries = files.map((file, index) => {
            return [file.fieldname, fileIds[index]];
        });

        const filesToUpload: any = {};
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

        const updatedProps = { ...props };

        Object.keys(filesToUpload).forEach((key) => {
            if (props?.[key] !== undefined) {
                if (Array.isArray(props[key])) {
                    updatedProps[key] = [...props[key], ...filesToUpload[key]];
                } else {
                    updatedProps[key] = [props[key], ...filesToUpload[key]];
                }
            } else if (props) {
                updatedProps[key] = filesToUpload[key];
            }
        });

        return { props: updatedProps, files: filesToUpload };
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
            const rows = await fixComplexProperties(
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

    static getEntityFileProperties(entityProperties: IEntity['properties'], template: IEntityTemplatePopulated): Record<string, string | string[]> {
        return objectFilter(entityProperties, (key) => {
            const propertyTemplate = template.properties.properties[key];
            return propertyTemplate.format === 'fileId' || propertyTemplate.items?.format === 'fileId';
        });
    }

    private static async setSerialPropertiesAndUpdateTemplate(
        entityProperties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplatePopulated,
    ): Promise<IEntity['properties']> {
        const updatedProperties: IEntity['properties'] = { ...entityProperties };

        let isTemplateUpdated = false;
        const updatedTemplateProperties = {
            ...entityTemplate.properties.properties,
        };

        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                updatedProperties[key] = Number(entityTemplate.properties.properties[key].serialCurrent);

                const serialNum: number = Number(entityTemplate.properties.properties[key].serialCurrent) + 1;
                const newSerialNumberObj = { ...entityTemplate.properties.properties[key], serialCurrent: serialNum };
                updatedTemplateProperties[key] = newSerialNumberObj;
                isTemplateUpdated = true;
            }
        });
        if (isTemplateUpdated) {
            const { category, _id, createdAt, updatedAt, disabled, ...restOfEntityTemplate } = entityTemplate;
            await EntityTemplateManagerService.updateEntityTemplate(entityTemplate._id, {
                ...restOfEntityTemplate,
                category: category._id,
                properties: {
                    ...entityTemplate.properties,
                    properties: updatedTemplateProperties,
                },
            });
        }

        return updatedProperties;
    }

    static async handlePreparationsBeforeCreateEntity(instanceData: IEntity, files: Express.Multer.File[]) {
        const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(files, instanceData.properties);

        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(instanceData.templateId);
        const newInstanceProperties = await InstancesManager.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, entityTemplate);

        return {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
        };
    }

    static async createEntityInstance(
        instanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        createAlert: boolean = true,
    ) {
        const newInstanceData: IEntity = await InstancesManager.handlePreparationsBeforeCreateEntity(instanceData, files);

        const { createdEntity, updatedEntities, actions } = await InstanceManagerService.createEntityInstance(
            newInstanceData,
            ignoredRules,
            userId,
        ).catch(InstancesManager.handleBrokenRulesError);

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: actions ?? [
                        {
                            actionType: ActionTypes.CreateEntity,
                            actionMetadata: {
                                templateId: createdEntity.templateId,
                                properties: createdEntity.properties,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return { createdEntity, updatedEntities };
    }

    private static async deleteUnusedFiles(currentEntity: IEntity, instanceData: IEntity, files: Express.Multer.File[]) {
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);
        const newFilesKeys = files.map((file) => file.fieldname);

        const fileProperties = InstancesManager.getEntityFileProperties(currentEntity.properties, entityTemplate);

        const fileIdsToDelete = Object.entries(fileProperties).flatMap(([key, value]) => {
            if (Array.isArray(value)) {
                return value.filter((fileId) => !(instanceData.properties[key] as string[]).includes(fileId));
            }
            if (!instanceData.properties[key] || newFilesKeys.includes(key)) {
                return value;
            }

            return [];
        });

        if (fileIdsToDelete.length === 0) {
            return [];
        }

        return deleteFiles(fileIdsToDelete);
    }

    static async updateEntityStatus(id: string, disabledStatus: boolean, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const entity = await InstanceManagerService.updateEntityStatus(id, disabledStatus, ignoredRules, userId).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: [
                        {
                            actionType: ActionTypes.UpdateStatus,
                            actionMetadata: {
                                entityId: id,
                                disabled: disabledStatus,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return entity;
    }

    static verifyFilePropertiesToDuplicateExistInCurrent(fileProperties: Record<string, string | string[]>, currentEntity: IEntity) {
        Object.entries(fileProperties).forEach(([key, value]) => {
            if (!value) return;

            if (Array.isArray(value)) {
                const unknownFileId = value.find((fileId) => !(currentEntity.properties[key] as string[] | undefined)?.includes(fileId));
                if (unknownFileId) {
                    throw new ServiceError(400, `duplicated entity contains unknown fileId ${unknownFileId} in key ${key}`);
                }
                return;
            }

            if (value !== currentEntity.properties[key]) {
                throw new ServiceError(400, `duplicated entity contains unknown fileId ${value} in key ${key}`);
            }
        });
    }

    static async duplicateFileProperties(fileProperties: Record<string, string | string[]>, currentEntity: IEntity) {
        InstancesManager.verifyFilePropertiesToDuplicateExistInCurrent(fileProperties, currentEntity);

        const filePropertiesToDuplicateEntries = Object.entries(fileProperties);
        const duplicatedFiles = await duplicateFiles(filePropertiesToDuplicateEntries.flatMap(([_key, value]) => value));

        let duplicatedFileIndex = 0;
        const duplicatedFilesProperties: Record<string, string | string[]> = {};
        filePropertiesToDuplicateEntries.forEach(([key, value]) => {
            if (Array.isArray(value)) {
                duplicatedFilesProperties[key] = [];
                value.forEach((_oldFileId) => {
                    (duplicatedFilesProperties[key] as string[]).push(duplicatedFiles[duplicatedFileIndex].path);
                    duplicatedFileIndex++;
                });
            } else {
                duplicatedFilesProperties[key] = duplicatedFiles[duplicatedFileIndex].path;
                duplicatedFileIndex++;
            }
        });

        return duplicatedFilesProperties;
    }

    static async duplicateEntityInstance(
        id: string,
        instanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicateFileProperties = true,
        createAlert: boolean = true,
    ) {
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);
        const currentEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        const fileProperties = InstancesManager.getEntityFileProperties(instanceData.properties, currentEntityTemplate);

        let duplicatedFileProperties: Record<string, string | string[]> = {};
        if (duplicateFileProperties) {
            duplicatedFileProperties = await InstancesManager.duplicateFileProperties(fileProperties, currentEntity);
        }

        const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(files, {
            ...instanceData.properties,
            ...duplicatedFileProperties,
        });

        const newInstanceProperties = await InstancesManager.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, currentEntityTemplate);

        const newInstanceData: IEntity = {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
        };

        const createInstanceOutput = await InstanceManagerService.createEntityInstance(newInstanceData, ignoredRules, userId, id).catch(
            InstancesManager.handleBrokenRulesError,
        );
        const { createdEntity, updatedEntities } = createInstanceOutput;
        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: [
                        {
                            actionType: ActionTypes.DuplicateEntity,
                            actionMetadata: {
                                templateId: createdEntity.templateId,
                                properties: createdEntity.properties,
                                entityIdToDuplicate: id,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return { createdEntity, updatedEntities };
    }

    static checkSerialFieldWasUpdated(
        entityTemplate: IMongoEntityTemplatePopulated,
        updatedInstanceDataProperties: IEntity['properties'],
        currentEntity: IEntity,
    ) {
        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                if (updatedInstanceDataProperties[key] !== currentEntity.properties[key]) {
                    throw new ServiceError(400, "can't change serial properties");
                }
            }
        });
    }

    static async updateEntityInstance(
        id: string,
        updatedInstanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        createAlert: boolean = true,
    ) {
        const { props: uploadedFilesAndProperties } = await InstancesManager.uploadInstanceFiles(files, updatedInstanceData.properties);
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);

        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        InstancesManager.checkSerialFieldWasUpdated(entityTemplate, updatedInstanceData.properties, currentEntity);

        const { updatedEntity, updatedEntities } = await InstanceManagerService.updateEntityInstance(
            id,
            {
                templateId: updatedInstanceData.templateId,
                properties: { ...uploadedFilesAndProperties },
            },
            ignoredRules,
            userId,
        ).catch(InstancesManager.handleBrokenRulesError);
        await InstancesManager.deleteUnusedFiles(currentEntity, updatedInstanceData, files).catch(() =>
            logger.error(`failed to delete files of instanceId ${id}`),
        );

        const updatedFields: Record<string, any> = {};

        const fields = Object.keys(entityTemplate.properties.properties);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const propertyTemplate = entityTemplate.properties.properties[field];

            let newValue: any;
            if (propertyTemplate?.format === 'fileId' || propertyTemplate?.items?.format === 'fileId') {
                newValue = uploadedFilesAndProperties[field] ?? updatedEntity.properties[field];
            } else if (propertyTemplate?.format === 'relationshipReference') {
                if (updatedEntity.properties[field]?.properties) newValue = updatedEntity.properties[field].properties._id;
                if (currentEntity.properties[field]?.properties) currentEntity.properties[field] = currentEntity.properties[field].properties._id;
            } else {
                newValue = updatedEntity.properties[field];
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
        }

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: [
                        {
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: {
                                entityId: id,
                                before: currentEntity.properties,
                                updatedFields,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return { updatedEntity, updatedEntities };
    }

    private static async deleteAllEntityFiles(currentEntity: IEntity) {
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(currentEntity.templateId);

        const filePropertiesToRemove = InstancesManager.getEntityFileProperties(currentEntity.properties, entityTemplate);
        const fileIdsToRemove = Object.values(filePropertiesToRemove).flat();

        if (fileIdsToRemove.length === 0) {
            return [];
        }

        return deleteFiles(fileIdsToRemove);
    }

    static async deleteEntityInstance(id: string, userId: string) {
        const currentEntity = await InstanceManagerService.getEntityInstanceById(id);
        const deletedInstance = await InstanceManagerService.deleteEntityInstance(id, userId);

        const { err: error } = await trycatch(() => InstancesManager.deleteAllEntityFiles(currentEntity));

        if (error) {
            logger.error(`failed to delete files of instanceId ${id}`, { error });
        }

        return deletedInstance;
    }

    static async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const createdRelationship = await InstanceManagerService.createRelationshipInstance(relationship, ignoredRules, userId).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: [
                        {
                            actionType: ActionTypes.CreateRelationship,
                            actionMetadata: {
                                relationshipTemplateId: relationship.templateId,
                                sourceEntityId: relationship.sourceEntityId,
                                destinationEntityId: relationship.destinationEntityId,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return createdRelationship;
    }

    static async deleteRelationshipInstance(relationshipId: string, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const relationship = await InstanceManagerService.deleteRelationshipInstance(relationshipId, ignoredRules, userId).catch(
            InstancesManager.handleBrokenRulesError,
        );

        if (createAlert && ignoredRules.length) {
            await RuleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: [
                        {
                            actionType: ActionTypes.DeleteRelationship,
                            actionMetadata: {
                                relationshipTemplateId: relationship.templateId,
                                relationshipId: relationship.properties._id,
                                sourceEntityId: relationship.sourceEntityId,
                                destinationEntityId: relationship.destinationEntityId,
                            },
                        },
                    ],
                },
                userId,
            );
        }

        return relationship;
    }

    static async handleBrokenRulesError(error: any): Promise<never> {
        if (axios.isAxiosError(error) && error.response?.data.metadata?.errorCode === errorCodes.ruleBlock) {
            const { brokenRules, actions } = error.response.data.metadata;

            throw new ServiceError(400, error.message, {
                errorCode: errorCodes.ruleBlock,
                brokenRules: await RuleBreachesManager.populateBrokenRules(brokenRules),
                rawBrokenRules: brokenRules,
                // in case that entityTemplate has actions
                ...(actions && {
                    actions: await RuleBreachesManager.populateActionsMetaData(actions),
                    rawActions: actions,
                }),
            });
        }

        throw error;
    }

    static extractEntitiesAndTemplatesIds(actionsGroups: IAction[][]): {
        templateIds: string[];
        entitiesIds: string[];
    } {
        const templateIds = new Set<string>();
        const entitiesIds = new Set<string>();

        actionsGroups.forEach((actionsGroup) =>
            actionsGroup.forEach((action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    templateIds.add((action.actionMetadata as ICreateEntityMetadata).templateId);
                } else if (action.actionType === ActionTypes.CreateRelationship) {
                    const { destinationEntityId, sourceEntityId } = action.actionMetadata as ICreateRelationshipMetadata;

                    if (!destinationEntityId.startsWith('$')) entitiesIds.add(destinationEntityId);
                    if (!sourceEntityId.startsWith('$')) entitiesIds.add(sourceEntityId);
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const { entityId } = action.actionMetadata as IUpdateEntityMetadata;
                    if (!entityId.startsWith('$')) entitiesIds.add(entityId);
                }
            }),
        );

        return { templateIds: [...templateIds], entitiesIds: [...entitiesIds] };
    }

    static async getManyEntitiesNewPropertiesToUpdate(entitiesToUpdate: IEntity[], templatesByIds: Dictionary<IMongoEntityTemplatePopulated[]>) {
        const entitiesNewPropertiesPromises = entitiesToUpdate.map((entityToUpdate) => {
            const [entityTemplate] = templatesByIds[entityToUpdate.templateId];

            return InstancesManager.setSerialPropertiesAndUpdateTemplate(entityToUpdate.properties, entityTemplate).then((properties) => {
                return {
                    templateId: entityToUpdate.templateId,
                    properties,
                };
            });
        });

        return Promise.all(entitiesNewPropertiesPromises);
    }

    static async getAllActionsTemplatesByIds(actionsGroups: IAction[][]) {
        const { templateIds: templateIdsFromReq, entitiesIds } = InstancesManager.extractEntitiesAndTemplatesIds(actionsGroups as IAction[][]);
        const templateIds = new Set<string>([...templateIdsFromReq]);

        const entities = await InstanceManagerService.getEntityInstancesByIds(entitiesIds);
        entities.forEach((entity) => templateIds.add(entity.templateId));

        const templates = await EntityTemplateManagerService.searchEntityTemplates({ ids: [...templateIds] });

        return {
            templatesByIds: groupBy(templates, (template) => template._id),
            entitiesByIds: groupBy(entities, (entity) => entity.properties._id),
        };
    }

    static async runBulkOfActions(actionsGroups: IAction[][], dryRun: boolean, userId: string, ignoredRules: IBrokenRule[] = []) {
        const { templatesByIds, entitiesByIds } = await InstancesManager.getAllActionsTemplatesByIds(actionsGroups);
        const entitiesToCreate: IEntity[] = [];

        actionsGroups.forEach((actionGroup) =>
            actionGroup.forEach((action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    const instanceData = action.actionMetadata as ICreateEntityMetadata;

                    // TODO - for now we are not support upload files in bulk, we will support it in the future
                    entitiesToCreate.push(instanceData);
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    const entity = entitiesByIds[actionMetadata.entityId][0];
                    const templateOfEntity = templatesByIds[entity.templateId][0];

                    InstancesManager.checkSerialFieldWasUpdated(templateOfEntity, actionMetadata.updatedFields, entity);
                }
            }),
        );

        const newEntitiesToCreateByActionsGroups = await InstancesManager.getManyEntitiesNewPropertiesToUpdate(entitiesToCreate, templatesByIds);
        let indexOfEntityToCreate = 0;

        const newActionsGroups = actionsGroups.map((actionsGroup) =>
            actionsGroup.map((action) => {
                if (action.actionType !== ActionTypes.CreateEntity) {
                    return action;
                }
                const newAction = {
                    ...action,
                    actionMetadata: newEntitiesToCreateByActionsGroups[indexOfEntityToCreate],
                };
                indexOfEntityToCreate++;
                return newAction;
            }),
        );

        return InstanceManagerService.runBulkOfActions(newActionsGroups, dryRun, userId, ignoredRules);
    }
}
