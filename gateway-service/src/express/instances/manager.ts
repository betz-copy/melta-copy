/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import axios, { AxiosError } from 'axios';
import { stream } from 'exceljs';
import { promises as fsp } from 'fs';
import { Dictionary } from 'lodash';
import groupBy from 'lodash.groupby';
import { menash } from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import {
    ISearchEntitiesByLocationBody,
    IBrokenRulesError,
    ICountSearchResult,
    IDeleteBody,
    IEntity,
    ISearchBatchBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    ISearchSort,
    ITemplateSearchBody,
} from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import {
    ActionErrors,
    ActionTypes,
    IAction,
    IBrokenRule,
    IBrokenRuleEntity,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IFailedEntity,
    IUpdateEntityMetadata,
} from '../../externalServices/ruleBreachService/interfaces';
import { StorageService } from '../../externalServices/storageService';
import {
    EntityTemplateService,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/templates/entityTemplateService';
import { trycatch } from '../../utils';
import { createWorkbook, createWorksheet, styleAWorksheet } from '../../utils/excel/createFunctions';
import DefaultManagerProxy from '../../utils/express/manager';
import logger from '../../utils/logger/logsLogger';
import { objectFilter } from '../../utils/object';
import { BadRequestError, ServiceError } from '../error';
import RuleBreachesManager from '../ruleBreaches/manager';
import { patchDocumentAsStream } from './documentExport';
import { IExportEntitiesBody } from './interfaces';
import { RabbitManager } from '../../utils/rabbit';
import { SemanticSearchService } from '../../externalServices/semanticSearch';
import { WorkspaceService } from '../workspaces/service';
import { createTextsFromEntitiesWithFiles, formatEntitiesBulkSearch, sortEntities } from '../../utils/semantic';
import { ISemanticSearchResult } from '../../externalServices/semanticSearch/interface';
import { getValidationErrorEntities, readExcelFile, updateIdOfBrokenRules } from '../../utils/excel/getFunctions';

const { errorCodes, rabbit, ruleBreachService } = config;

export class InstancesManager extends DefaultManagerProxy<InstancesService> {
    private entityTemplateService: EntityTemplateService;

    private storageService: StorageService;

    private semanticSearchSearch: SemanticSearchService;

    private ruleBreachesManager: RuleBreachesManager;

    private rabbitManager: RabbitManager;

    private workspaceId: string;

    constructor(workspaceId: string) {
        super(new InstancesService(workspaceId));
        this.workspaceId = workspaceId;
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.storageService = new StorageService(workspaceId);
        this.semanticSearchSearch = new SemanticSearchService(workspaceId);
        this.ruleBreachesManager = new RuleBreachesManager(workspaceId);
        this.rabbitManager = new RabbitManager(workspaceId);
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
        const tasks = Object.entries(templates).map(async ([templateId, { filter, sort, displayColumns, headersOnly, insertEntities }]) => {
            const template = await this.entityTemplateService.getEntityTemplateById(templateId);
            await this.createWorksheet(workbook, template, filter, sort, textSearch, workspace, displayColumns, headersOnly, insertEntities);
        });

        await Promise.all(tasks);
    }

    async searchEntitiesOfTemplate(
        templateId: string,
        searchBody: ISearchEntitiesOfTemplateBody & { entitiesWithFiles: ISemanticSearchResult[string] },
    ) {
        const { entitiesWithFiles, ...body } = searchBody;

        if (!entitiesWithFiles || !Object.keys(entitiesWithFiles)?.length || !body.textSearch) {
            return this.service.searchEntitiesOfTemplateRequest(templateId, body);
        }

        const searchResult = await this.service.searchEntitiesOfTemplateRequest(templateId, {
            ...body,
            entityIdsToInclude: Object.keys(entitiesWithFiles),
        });

        if (body.sort?.length) {
            return searchResult;
        }

        const texts = createTextsFromEntitiesWithFiles(searchResult, entitiesWithFiles, body.textSearch);
        const rerank = await this.semanticSearchSearch.rerank({ query: body.textSearch, texts: Object.keys(texts) });

        if (!rerank?.length) {
            return searchResult;
        }

        return { ...searchResult, entities: sortEntities(searchResult.entities, rerank, texts) };
    }

    private async createWorksheet(
        workbook: stream.xlsx.WorkbookWriter,
        template: IMongoEntityTemplatePopulated,
        filter: ISearchFilter | undefined,
        sort: ISearchSort | undefined,
        textSearch: string | undefined,
        workspace: { path: string; id: string },
        displayColumns?: string[],
        headersOnly?: boolean,
        insertEntities?: Record<string, any>[],
    ) {
        const worksheet = await createWorksheet(workbook, template, displayColumns, headersOnly || !!insertEntities);
        const { searchEntitiesChunkSize } = config.service;

        if (headersOnly) return;

        if (insertEntities) {
            styleAWorksheet(worksheet, insertEntities, template, workspace, displayColumns);
            return;
        }

        const templateCount = await this.getEntitiesCountByTemplates(true, {
            templateIds: [template._id],
            textSearch,
        });

        const { count, entitiesWithFiles } = templateCount?.[0] ?? { count: 0, entitiesWithFiles: {} };

        // Remove the ?? 0 because it create infinite loop
        for (let skip = 0; (count ?? 0) - skip > 0; skip += searchEntitiesChunkSize) {
            const { entities: chunk } = await this.service.searchEntitiesOfTemplateRequest(template._id, {
                skip,
                limit: searchEntitiesChunkSize,
                textSearch,
                filter,
                sort,
                entityIdsToInclude: Object.keys(entitiesWithFiles ?? {}),
            });
            styleAWorksheet(
                worksheet,
                chunk.map((row) => row.entity.properties),
                template,
                workspace,
                displayColumns,
                headersOnly,
                skip,
            );
        }
    }

    getSerialStarters = (template: IMongoEntityTemplatePopulated): Record<string, number> => {
        return Object.entries(template.properties.properties)
            .filter(([_key, value]) => value.type === 'number' && value.serialStarter !== undefined)
            .reduce((acc, [key, value]) => {
                acc[key] = value.serialCurrent || 0;
                return acc;
            }, {});
    };

    handleLoadEntitiesErrors = (error: any, failedEntities: IFailedEntity[], entity: IEntity, allBrokenRulesEntities: IBrokenRuleEntity[]) => {
        if (error instanceof AxiosError) {
            if (!error.response) throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'no error.response in axiosError', error);

            const { data } = error.response;

            if (data.metadata && data.metadata.errorCode === errorCodes.failedConstraintsValidation) {
                const { constraint } = data.metadata;
                switch (constraint.type) {
                    case ActionErrors.unique:
                        failedEntities.push({
                            properties: entity.properties,
                            errors: [{ type: ActionErrors.unique, metadata: constraint }],
                        });
                        break;
                    case ActionErrors.required:
                        failedEntities.push({
                            properties: entity.properties,
                            errors: [{ type: ActionErrors.required, metadata: constraint }],
                        });
                        break;
                    default:
                        break;
                }
            }
            if (data.type === errorCodes.templateValidationError) getValidationErrorEntities(error as AxiosError, failedEntities);
        } else if ((error as IBrokenRulesError).metadata.errorCode === errorCodes.ruleBlock) {
            allBrokenRulesEntities.push({
                brokenRules: error.metadata.brokenRules,
                rawBrokenRules: error.metadata.rawBrokenRules,
                actions: error.metadata.actions ?? [
                    {
                        actionType: ActionTypes.CreateEntity,
                        actionMetadata: entity,
                    },
                ],
                rawActions: error.metadata.rawActions ?? [
                    {
                        actionType: ActionTypes.CreateEntity,
                        actionMetadata: entity,
                    },
                ],
                entities: [{ properties: entity.properties }],
            });
        }
    };

    updateTemplateCurrentNumbers = async (
        template: IMongoEntityTemplatePopulated,
        serialStarters: Record<string, number>,
        succeededIndex: number,
    ) => {
        const serialProperties = Object.entries(template.properties.properties)
            .filter(([_key, value]) => value.type === 'number' && !!value.serialStarter && !!value.serialCurrent)
            .reduce((acc, [key, value]) => {
                acc[key] = { ...value, serialCurrent: serialStarters[key] + succeededIndex };
                return acc;
            }, {});
        const { category, _id, createdAt, updatedAt, disabled, ...restOfEntityTemplate } = template;
        await this.entityTemplateService.updateEntityTemplate(template._id, {
            ...restOfEntityTemplate,
            category: category._id,
            properties: {
                ...template.properties,
                properties: { ...template.properties.properties, ...serialProperties },
            },
        });
    };

    async loadEntities(
        templateId: string,
        userId: string,
        files?: Express.Multer.File[],
        insertBrokenEntities?: { entitiesToCreate: IEntity[]; ignoredRules: IBrokenRule[] },
    ) {
        let entities = insertBrokenEntities?.entitiesToCreate;
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);

        const failedEntities: IFailedEntity[] = [];

        if (files && !entities) {
            const workspace = await WorkspaceService.getById(this.workspaceId);
            const workspaceFilesLimit = workspace.metadata?.excel?.filesLimit;

            const effectiveFilesLimit = workspaceFilesLimit ?? config.loadExcel.filesLimit;

            if (files.length > effectiveFilesLimit) {
                throw new BadRequestError(`files limit: more than ${effectiveFilesLimit} files`, {});
            }

            const actions = await readExcelFile(files, template, failedEntities, workspace.metadata?.excel?.entitiesFileLimit);
            entities = actions;
        }
        const serialStarters = this.getSerialStarters(template);
        const generateSerialNumbers = (index: number) =>
            Object.fromEntries(Object.entries(serialStarters).map(([key, value]) => [key, value + index]));

        const succeededEntities: IEntity[] = [];
        const allBrokenRulesEntities: IBrokenRuleEntity[] = [];
        const results: IEntity[] = [];

        const handleLoadEntities = async (entity: IEntity) => {
            try {
                const serialNumbers = generateSerialNumbers(succeededEntities.length);
                const result = await this.createEntityInstance(entity, [], insertBrokenEntities?.ignoredRules || [], userId, serialNumbers);
                results.push(result);
            } catch (error) {
                this.handleLoadEntitiesErrors(error, failedEntities, entity, allBrokenRulesEntities);
            }
        };

        if (Object.keys(serialStarters).length > 0) for (const entity of entities!) handleLoadEntities(entity);
        else await Promise.all(entities!.map(async (entity) => handleLoadEntities(entity)));

        succeededEntities.push(...results);

        const brokenRulesEntities = await updateIdOfBrokenRules(allBrokenRulesEntities);
        if (serialStarters) await this.updateTemplateCurrentNumbers(template, serialStarters, succeededEntities.length);

        return { succeededEntities, failedEntities, brokenRulesEntities };
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
        serialNumbers?: Record<string, number>,
    ): Promise<IEntity['properties']> {
        const updatedProperties: IEntity['properties'] = { ...entityProperties };

        let isTemplateUpdated = serialNumbers ?? false;
        const updatedTemplateProperties = {
            ...entityTemplate.properties.properties,
        };

        Object.keys(entityTemplate.properties.properties).forEach((key) => {
            if (entityTemplate.properties.properties[key].serialCurrent !== undefined) {
                const serialCurrent = serialNumbers ? serialNumbers[key] : Number(entityTemplate.properties.properties[key].serialCurrent);
                updatedProperties[key] = serialCurrent;

                const serialNum: number = serialCurrent + 1;
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

    async handlePreparationsBeforeCreateEntity(instanceData: IEntity, files: Express.Multer.File[], serialNumbers?: Record<string, number>) {
        const { props: propertiesWithFiles, files: upserstedFiles } = await this.uploadInstanceFiles(files, instanceData.properties);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(instanceData.templateId);
        const newInstanceProperties = await this.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, entityTemplate, serialNumbers);

        return {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
            files: upserstedFiles,
        };
    }

    async createEntityInstance(
        instanceData: IEntity,
        files: Express.Multer.File[],
        ignoredRules: IBrokenRule[],
        userId: string,
        serialNumbers?: Record<string, number>,
        createAlert: boolean = true,
    ) {
        const { templateId, properties, files: upserstedFiles } = await this.handlePreparationsBeforeCreateEntity(instanceData, files, serialNumbers);

        const { createdEntity, actions } = await this.service
            .createEntityInstance({ properties, templateId }, ignoredRules, userId)
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
        } else {
            await this.rabbitManager.indexFiles(createdEntity.templateId, createdEntity.properties._id, Object.values(upserstedFiles).flat());
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

        await this.rabbitManager.deleteFiles(currentEntity.templateId, currentEntity.properties._id, fileIdsToDelete);
        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify({ fileIds: fileIdsToDelete, bucketName: this.workspaceId }));

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

    async searchEntitiesBatch(shouldSemanticSearch: boolean, searchBody: ISearchBatchBody) {
        if (!shouldSemanticSearch || !searchBody.textSearch) {
            return this.service.searchEntitiesBatch(searchBody);
        }

        const semanticSearchResult = await this.semanticSearchSearch.search({
            textSearch: searchBody.textSearch,
            limit: searchBody.limit,
            skip: searchBody.skip,
            templates: Object.keys(searchBody.templates),
        });

        const allResults = await this.service.searchEntitiesBatch({
            ...searchBody,
            entityIdsToInclude: semanticSearchResult ? Object.values(semanticSearchResult).map(Object.keys).flat() : undefined,
        });

        const { formattedEntities, textsForReranking } = formatEntitiesBulkSearch(allResults, searchBody.textSearch, semanticSearchResult);
        const rerank = await this.semanticSearchSearch.rerank({ query: searchBody.textSearch, texts: Object.keys(textsForReranking) });

        if (!rerank?.length) {
            return formattedEntities;
        }

        return { ...formattedEntities, entities: sortEntities(formattedEntities.entities, rerank, textsForReranking) };
    }

    async getEntitiesCountByTemplates(shouldSemanticSearch: boolean, searchBody: ITemplateSearchBody): Promise<ICountSearchResult[] | undefined> {
        return this.service.getEntitiesCountByTemplates({
            ...searchBody,
            semanticSearchResult:
                searchBody.textSearch && shouldSemanticSearch
                    ? await this.semanticSearchSearch.search({
                          textSearch: searchBody.textSearch,
                          templates: searchBody.templateIds,
                      })
                    : undefined,
        });
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
        } else {
            const fileIds = Object.values(fileProperties).flat();
            await this.rabbitManager.indexFiles(createdEntity.templateId, createdEntity.properties._id, fileIds);
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
        const { props: uploadedFilesAndProperties, files: updatedFiles } = await this.uploadInstanceFiles(files, updatedInstanceData.properties);
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
        } else {
            await this.rabbitManager.indexFiles(updatedEntity.templateId, updatedEntity.properties._id, Object.values(updatedFiles).flat());
        }

        return updatedEntity;
    }

    private async deleteAllEntitiesFiles(fileIdsToRemove: string[]) {
        if (!fileIdsToRemove.length) return [];

        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify({ fileIds: fileIdsToRemove, bucketName: this.workspaceId }));

        return fileIdsToRemove;
    }

    async deleteEntityInstances(deleteBody: IDeleteBody) {
        const filesOfDeletedInstances = await this.service.deleteEntityInstances(deleteBody);

        const { err: error } = await trycatch(() => this.deleteAllEntitiesFiles(filesOfDeletedInstances));

        if (error) logger.error(`failed to delete files ${filesOfDeletedInstances}`, { error });
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
    }

    async searchEntitiesByLocation(reqBody: ISearchEntitiesByLocationBody) {
        const entityTemplates = await this.entityTemplateService.searchEntityTemplates({ ids: Object.keys(reqBody.templates) });

        const locationFieldsMap = entityTemplates.reduce((acc, entityTemplate) => {
            const { _id, properties } = entityTemplate;

            const locationKeys = Object.entries(properties.properties)
                .filter(([, value]) => value.format === 'location')
                .map(([key]) => key);

            if (locationKeys.length > 0) {
                acc[_id] = { filter: reqBody.templates[_id].filter, locationFields: locationKeys };
            }

            return acc;
        }, {});

        return this.service.searchEntitiesByLocationRequest({ ...reqBody, templates: locationFieldsMap } as ISearchEntitiesByLocationBody);
    }
}
