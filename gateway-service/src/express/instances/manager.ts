/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import axios, { AxiosError } from 'axios';
import Excel, { stream } from 'exceljs';
import { promises as fsp } from 'fs';
import { Dictionary } from 'lodash';
import groupBy from 'lodash.groupby';
import { menash } from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { IEntity, ISearchFilter, ISearchSort } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import {
    ActionTypes,
    IAction,
    IBrokenRule,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IUpdateEntityMetadata,
} from '../../externalServices/ruleBreachService/interfaces';
import { StorageService } from '../../externalServices/storageService';
import {
    EntityTemplateService,
    IEntitySingleProperty,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/templates/entityTemplateService';
import { trycatch } from '../../utils';
import { createWorkbook, createWorksheet, styleAWorksheet } from '../../utils/excel/excelFunctions';
import DefaultManagerProxy from '../../utils/express/manager';
import logger from '../../utils/logger/logsLogger';
import { objectFilter } from '../../utils/object';
import { BadRequestError, ServiceError } from '../error';
import RuleBreachesManager from '../ruleBreaches/manager';
import { patchDocumentAsStream } from './documentExport';
import { IExportEntitiesBody } from './interfaces';
import { excelConfig } from '../../utils/excel/excelConfig';
import { WorkspaceService } from '../workspaces/service';
import { IBrokenRulePopulated } from '../../externalServices/ruleBreachService/interfaces/populated';

const { errorCodes, rabbit, ruleBreachService } = config;

export class InstancesManager extends DefaultManagerProxy<InstancesService> {
    private entityTemplateService: EntityTemplateService;

    private storageService: StorageService;

    private ruleBreachesManager: RuleBreachesManager;

    private workspaceId: string;

    constructor(workspaceId: string) {
        super(new InstancesService(workspaceId));
        this.workspaceId = workspaceId;
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.storageService = new StorageService(workspaceId);
        this.ruleBreachesManager = new RuleBreachesManager(workspaceId);
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
            if (props?.[key] !== undefined) {
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

        const workspace = await WorkspaceService.getById(this.workspaceId);
        const { path, name, type } = workspace;
        const workspacePath = `${path}/${name}${type}`;

        try {
            await this.addWorksheetsToWB(exportEntitiesBody, workbook, { path: workspacePath, id: this.workspaceId });
            await workbook.commit();
        } catch (err) {
            await fsp.unlink(filePath);
            throw err;
        }
        return filePath;
    }

    private async addWorksheetsToWB(
        { templates, textSearch }: IExportEntitiesBody,
        workbook: stream.xlsx.WorkbookWriter,
        workspace: { path: string; id: string },
    ): Promise<void> {
        const tasks = Object.entries(templates).map(async ([templateId, { filter, sort, displayColumns, insertEntities }]) => {
            const template = await this.entityTemplateService.getEntityTemplateById(templateId);
            await this.createWorksheet(workbook, template, filter, sort, textSearch, workspace, displayColumns, insertEntities);
        });

        await Promise.all(tasks);
    }

    private async createWorksheet(
        workbook: stream.xlsx.WorkbookWriter,
        template: IMongoEntityTemplatePopulated,
        filter: ISearchFilter | undefined,
        sort: ISearchSort | undefined,
        textSearch: string | undefined,
        workspace: { path: string; id: string },
        displayColumns?: string[],
        insertEntities?: { insert: boolean; entities?: Record<string, any>[] },
    ) {
        const worksheet = await createWorksheet(workbook, template, displayColumns, insertEntities);
        const { searchEntitiesChunkSize } = config.service;

        if (!insertEntities?.insert || insertEntities?.entities) {
            if (insertEntities?.entities) styleAWorksheet(worksheet, insertEntities.entities, template, workspace, displayColumns);
            else {
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
                    styleAWorksheet(
                        worksheet,
                        chunk.map((row) => row.entity.properties),
                        template,
                        workspace,
                        displayColumns,
                    );
                }
            }
        }
    }

    async loadExcelEntities(file: Express.Multer.File, templateId: string, userId: string) {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);
        const actions = await this.readExcelFile(file, template);
        const allEntities = actions.map((action) => action.actionMetadata);
        let result: PromiseSettledResult<(IEntity | IRelationship)[]>[] = [{ status: 'rejected', reason: {} }];

        type IErrorProperty = { message: string; path: string; schemaPath: string; params: Partial<IEntitySingleProperty> };
        type IErrorData = {
            properties: Record<string, any>;
            errors: IErrorProperty[];
        };

        const failedEntities: IErrorData[] = [];
        let brokenRulesEntities:
            | { rawBrokenRules: IBrokenRule[]; brokenRules: IBrokenRulePopulated[]; entities: { properties: Record<string, any> }[] }
            | undefined;
        while (result[0].status !== 'fulfilled' && result.length > 0) {
            try {
                result = await this.runBulkOfActions([actions], true, userId, []);
                if (result[0].status === 'rejected') {
                    if (result[0].reason.metadata.errorCode === 'RULE_BLOCK') {
                        const entities = result[0].reason.metadata.brokenRules
                            .map((brokenRule: IBrokenRule) =>
                                brokenRule.failures.map((failure) => {
                                    const entityIdNumberMatch = failure.entityId.match(/\d+/);
                                    const index = entityIdNumberMatch ? Number(entityIdNumberMatch[0]) : 0;
                                    const action = actions[index];
                                    actions.splice(index, 1);

                                    return { properties: (action.actionMetadata as ICreateEntityMetadata).properties };
                                }),
                            )
                            .flat();
                        const rawBrokenRules = result[0].reason.metadata.brokenRules;
                        const brokenRulePopulated = await this.ruleBreachesManager.populateBrokenRules(rawBrokenRules);

                        brokenRulesEntities = {
                            rawBrokenRules,
                            brokenRules: brokenRulePopulated,
                            entities,
                        };
                    }
                }
            } catch (error) {
                const errorData = (error as AxiosError).response?.data as {
                    type: string;
                    message: string;
                    metadata: {
                        properties: Record<string, any> & { index: number };
                        errors: IErrorProperty[];
                    };
                };

                const { metadata } = errorData;
                const { properties, errors } = metadata;
                const { index, ...entityProperties } = properties;

                actions.splice(index, 1);
                failedEntities.push({ properties: entityProperties, errors });
            }
        }

        return {
            allEntities,
            succeededEntities: result[0].status === 'fulfilled' ? result[0].value : [],
            failedEntities,
            brokenRulesEntities,
        };
    }

    private formatExcel(value: Excel.CellValue | string, propertyTemplate: IEntitySingleProperty) {
        const { type, format } = propertyTemplate;
        if (value === null) return undefined;

        if (type === 'boolean') {
            if (value === excelConfig.TRUE_TO_HEBREW) return true;
            if (value === excelConfig.FALSE_TO_HEBREW) return false;
        }
        if (type === 'string') {
            if (format === 'date') return new Date(value as string).toLocaleDateString('en-uk');
            if (format === 'date-time') return new Date(value as string).toLocaleString('en-uk');
        }
        if (type === 'array') {
            if (propertyTemplate.items && propertyTemplate.items.type === 'string' && typeof value === 'object' && 'richText' in value)
                return value?.richText.map((item) => item.text).filter((text) => text !== ', ');
        }
        return value;
    }

    private async readExcelFile(file: Express.Multer.File, template: IMongoEntityTemplatePopulated) {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(file.path);
        const worksheet = workbook.worksheets[0];

        const expectedName = `${template.displayName}${template._id}`.trim();
        if (!expectedName.includes(worksheet.name)) throw new ServiceError(StatusCodes.BAD_REQUEST, 'invalid excel');

        const actions: IAction[] = [];
        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex === 1) return;

            const rowData: Record<string, any> = {};

            Object.entries(template.properties.properties).forEach(([key, value], columnIndex) => {
                const cellValue = row.getCell(columnIndex + 1).value;
                const formatCellValue = this.formatExcel(cellValue, value);
                rowData[key] = formatCellValue;
            });
            const action = { actionType: ActionTypes.CreateEntity, actionMetadata: { templateId: template._id, properties: rowData } };

            actions.push(action);
        });

        return actions;
    }

    getEntityFileProperties(entityProperties: IEntity['properties'], template: IEntityTemplatePopulated): Record<string, string | string[]> {
        return objectFilter(entityProperties, (key) => {
            const propertyTemplate = template.properties.properties[key];
            return propertyTemplate && (propertyTemplate.format === 'fileId' || propertyTemplate.items?.format === 'fileId');
        });
    }

    private async setSerialPropertiesAndUpdateTemplate(
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
            await this.entityTemplateService.updateEntityTemplate(entityTemplate._id, {
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

    async handlePreparationsBeforeCreateEntity(instanceData: IEntity, files: Express.Multer.File[]) {
        const { props: propertiesWithFiles } = await this.uploadInstanceFiles(files, instanceData.properties);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(instanceData.templateId);
        const newInstanceProperties = await this.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, entityTemplate);

        return {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
        };
    }

    async createEntityInstance(
        instanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        createAlert: boolean = true,
    ) {
        const newInstanceData: IEntity = await this.handlePreparationsBeforeCreateEntity(instanceData, files);

        const { createdEntity, actions } = await this.service
            .createEntityInstance(newInstanceData, ignoredRules, userId)
            .catch((err) => this.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert(
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

        return createdEntity;
    }

    private async deleteUnusedFiles(currentEntity: IEntity, instanceData: IEntity, files: Express.Multer.File[]) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);
        const newFilesKeys = files.map((file) => file.fieldname);

        const fileProperties = this.getEntityFileProperties(currentEntity.properties, entityTemplate);

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

        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify(fileIdsToDelete));

        return fileIdsToDelete;
    }

    async exportEntityToDocumentTemplate({
        documentTemplateId,
        entityProperties,
    }: {
        documentTemplateId: string;
        entityProperties: IEntity['properties'];
    }) {
        return patchDocumentAsStream(await this.storageService.downloadFile(documentTemplateId), entityProperties);
    }

    async updateEntityStatus(id: string, disabledStatus: boolean, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const entity = await this.service
            .updateEntityStatus(id, disabledStatus, ignoredRules, userId)
            .catch((err) => this.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert(
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

    verifyFilePropertiesToDuplicateExistInCurrent(fileProperties: Record<string, string | string[]>, currentEntity: IEntity) {
        Object.entries(fileProperties).forEach(([key, value]) => {
            if (!value) return;

            if (Array.isArray(value)) {
                const unknownFileId = value.find((fileId) => !(currentEntity.properties[key] as string[] | undefined)?.includes(fileId));
                if (unknownFileId) {
                    throw new BadRequestError(`duplicated entity contains unknown fileId ${unknownFileId} in key ${key}`);
                }
                return;
            }

            if (value !== currentEntity.properties[key]) {
                throw new BadRequestError(`duplicated entity contains unknown fileId ${value} in key ${key}`);
            }
        });
    }

    async duplicateFileProperties(fileProperties: Record<string, string | string[]>, currentEntity: IEntity) {
        this.verifyFilePropertiesToDuplicateExistInCurrent(fileProperties, currentEntity);

        const filePropertiesToDuplicateEntries = Object.entries(fileProperties);
        const duplicatedFiles = await this.storageService.duplicateFiles(filePropertiesToDuplicateEntries.flatMap(([_key, value]) => value));

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

    async duplicateEntityInstance(
        id: string,
        instanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicateFileProperties = true,
        createAlert: boolean = true,
    ) {
        const currentEntity = await this.service.getEntityInstanceById(id);
        const currentEntityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        const fileProperties = this.getEntityFileProperties(instanceData.properties, currentEntityTemplate);

        let duplicatedFileProperties: Record<string, string | string[]> = {};
        if (duplicateFileProperties) {
            duplicatedFileProperties = await this.duplicateFileProperties(fileProperties, currentEntity);
        }

        const { props: propertiesWithFiles } = await this.uploadInstanceFiles(files, {
            ...instanceData.properties,
            ...duplicatedFileProperties,
        });

        const newInstanceProperties = await this.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, currentEntityTemplate);

        const newInstanceData: IEntity = {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
        };

        const { createdEntity, actions } = await this.service
            .createEntityInstance(newInstanceData, ignoredRules, userId, id)
            .catch((err) => this.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: actions ?? [
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

        return createdEntity;
    }

    checkSerialFieldWasUpdated(
        entityTemplate: IMongoEntityTemplatePopulated,
        updatedInstanceDataProperties: IEntity['properties'],
        currentEntity: IEntity,
    ) {
        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                if (updatedInstanceDataProperties[key] !== currentEntity.properties[key]) {
                    throw new BadRequestError("can't change serial properties");
                }
            }
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

        this.checkSerialFieldWasUpdated(entityTemplate, updatedInstanceData.properties, currentEntity);

        const { updatedEntity, actions } = await this.service
            .updateEntityInstance(
                id,
                {
                    templateId: updatedInstanceData.templateId,
                    properties: { ...uploadedFilesAndProperties },
                },
                ignoredRules,
                userId,
            )
            .catch((err) => this.handleBrokenRulesError(err));
        await this.deleteUnusedFiles(currentEntity, updatedInstanceData, files).catch((error) =>
            logger.error(`failed to delete files of instanceId ${id}`, { error }),
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
            await this.ruleBreachesManager.createRuleBreachAlert(
                {
                    brokenRules: ignoredRules,
                    actions: actions ?? [
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

        return updatedEntity;
    }

    private async deleteAllEntityFiles(currentEntity: IEntity) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        const filePropertiesToRemove = this.getEntityFileProperties(currentEntity.properties, entityTemplate);
        const fileIdsToRemove = Object.values(filePropertiesToRemove).flat();

        if (fileIdsToRemove.length === 0) {
            return [];
        }

        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify(fileIdsToRemove));

        return fileIdsToRemove;
    }

    async deleteEntityInstance(id: string) {
        const currentEntity = await this.service.getEntityInstanceById(id);
        const deletedInstance = await this.service.deleteEntityInstance(id);

        const { err: error } = await trycatch(() => this.deleteAllEntityFiles(currentEntity));

        if (error) {
            logger.error(`failed to delete files of instanceId ${id}`, { error });
        }

        return deletedInstance;
    }

    async createRelationshipInstance(relationship: IRelationship, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const createdRelationship = await this.service
            .createRelationshipInstance(relationship, ignoredRules, userId)
            .catch((err) => this.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert(
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

    async deleteRelationshipInstance(relationshipId: string, ignoredRules: IBrokenRule[], userId: string, createAlert: boolean = true) {
        const relationship = await this.service
            .deleteRelationshipInstance(relationshipId, ignoredRules, userId)
            .catch((err) => this.handleBrokenRulesError(err));

        if (createAlert && ignoredRules.length) {
            await this.ruleBreachesManager.createRuleBreachAlert(
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

    async handleBrokenRulesError(error: any): Promise<never> {
        if (axios.isAxiosError(error) && error.response?.data.metadata?.errorCode === errorCodes.ruleBlock) {
            const { brokenRules, actions } = error.response.data.metadata;

            throw new BadRequestError(error.message, {
                errorCode: errorCodes.ruleBlock,
                brokenRules: await this.ruleBreachesManager.populateBrokenRules(brokenRules),
                rawBrokenRules: brokenRules,
                // in case that entityTemplate has actions
                ...(actions && {
                    actions: await this.ruleBreachesManager.populateActionsMetaData(actions),
                    rawActions: actions,
                }),
            });
        }

        throw error;
    }

    extractEntitiesAndTemplatesIds(actionsGroups: IAction[][]): {
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

                    if (!destinationEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) entitiesIds.add(destinationEntityId);
                    if (!sourceEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) entitiesIds.add(sourceEntityId);
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const { entityId } = action.actionMetadata as IUpdateEntityMetadata;
                    if (!entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) entitiesIds.add(entityId);
                }
            }),
        );

        return { templateIds: [...templateIds], entitiesIds: [...entitiesIds] };
    }

    async getManyEntitiesNewPropertiesToUpdate(entitiesToUpdate: IEntity[], templatesByIds: Dictionary<IMongoEntityTemplatePopulated[]>) {
        const entitiesNewPropertiesPromises = entitiesToUpdate.map(async (entityToUpdate) => {
            const [entityTemplate] = templatesByIds[entityToUpdate.templateId];

            return this.setSerialPropertiesAndUpdateTemplate(entityToUpdate.properties, entityTemplate).then((properties) => {
                return {
                    templateId: entityToUpdate.templateId,
                    properties,
                };
            });
        });

        return Promise.all(entitiesNewPropertiesPromises);
    }

    async getAllActionsTemplatesByIds(actionsGroups: IAction[][]) {
        const { templateIds: templateIdsFromReq, entitiesIds } = this.extractEntitiesAndTemplatesIds(actionsGroups as IAction[][]);
        const templateIds = new Set<string>([...templateIdsFromReq]);

        const entities = await this.service.getEntityInstancesByIds(entitiesIds);
        entities.forEach((entity) => templateIds.add(entity.templateId));

        const templates = await this.entityTemplateService.searchEntityTemplates({ ids: [...templateIds] });

        return {
            templatesByIds: groupBy(templates, (template) => template._id),
            entitiesByIds: groupBy(entities, (entity) => entity.properties._id),
        };
    }

    async runBulkOfActions(actionsGroups: IAction[][], dryRun: boolean, userId: string, ignoredRules: IBrokenRule[] = []) {
        const { templatesByIds, entitiesByIds } = await this.getAllActionsTemplatesByIds(actionsGroups);
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

                    this.checkSerialFieldWasUpdated(templateOfEntity, actionMetadata.updatedFields, entity);
                }
            }),
        );

        const newEntitiesToCreateByActionsGroups = await this.getManyEntitiesNewPropertiesToUpdate(entitiesToCreate, templatesByIds);
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

        return this.service.runBulkOfActions(newActionsGroups, dryRun, userId, ignoredRules);

        // if (!catchErrors) return this.service.runBulkOfActions(newActionsGroups, dryRun, userId, ignoredRules);
        // console.dir({ newActionsGroups }, { depth: null });
        // let result: PromiseSettledResult<(IEntity | IRelationship)[]>[] = [{ status: 'rejected', reason: {} }];
        // while (result[0].status !== 'fulfilled' && result.length > 0) {
        //     result = this.service.runBulkOfActions(newActionsGroups, dryRun, userId, ignoredRules);
        //     console.dir({ result }, { depth: null });

        //     if (result[0].status === 'rejected') {
        //     }
        // }
    }
}
