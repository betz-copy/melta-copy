/** biome-ignore-all lint/suspicious/noExplicitAny: properties need to be of type any */

import { promises as fsp } from 'node:fs';
import {
    ActionTypes,
    BadRequestError,
    combineFilters,
    EntityTemplateType,
    FilterLogicalOperator,
    getDashboardFilters,
    getDefaultFilterFromChildTemplate,
    getFilterFromChildTemplate,
    getFilterModal,
    IAction,
    IBrokenRule,
    IBrokenRuleEntity,
    IBulkOfActions,
    IBulkRuleMail,
    IChartBody,
    ICountSearchResult,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IDeleteEntityBody,
    IEntity,
    IEntitySingleProperty,
    IEntityTemplatePopulated,
    IEntityWithDirectRelationships,
    IEntityWithIgnoredRules,
    IExportEntitiesBody,
    IFailedEntity,
    IFullMongoEntityTemplate,
    IMongoChildTemplatePopulated,
    IMongoEntityTemplatePopulated,
    IMultipleSelect,
    IRelationship,
    IRuleMail,
    ISearchBatchBody,
    ISearchEntitiesByLocationBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    ISearchResult,
    ISearchSort,
    ISemanticSearchResult,
    ITemplateSearchBody,
    IUpdateEntityMetadata,
    isAdmin,
    logger,
    matchValueAgainstFilter,
    NotFoundError,
    NotFoundErrorTypes,
    TemplateItem,
    UploadedFile,
} from '@microservices/shared';
import axios from 'axios';
import { stream } from 'exceljs';
import { keyBy, mapValues, omit } from 'lodash';
import { menash } from 'menashmq';
import pMap from 'p-map';
import config from '../../config';
import FilterValidation from '../../error';
import ChartService from '../../externalServices/dashboardService/chartService';
import DashboardItemService from '../../externalServices/dashboardService/dashboardItemService';
import InstancesService from '../../externalServices/instanceService';
import { PreviewService } from '../../externalServices/previewService';
import { SemanticSearchService } from '../../externalServices/semanticSearch';
import StorageService from '../../externalServices/storageService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import UserService from '../../externalServices/userService';
import { trycatch } from '../../utils';
import { getUserFields } from '../../utils/entities';
import { classifyEntityErrors, generateSerialNumbers, getAllEntitiesFromExcel, getSerialStarters } from '../../utils/excel';
import { createWorkbook, createWorksheet, styleAWorksheet } from '../../utils/excel/createFunctions';
import { handleUserFields } from '../../utils/excel/fieldHandling';
import { convertIdOfBrokenRules, isIncludedColumn, readExcelFile } from '../../utils/excel/getFunctions';
import DefaultManagerProxy from '../../utils/express/manager';
import { objectFilter } from '../../utils/object';
import RabbitManager from '../../utils/rabbit';
import { createTextsFromEntitiesWithFiles, formatEntitiesBulkSearch, sortEntities } from '../../utils/semantic';
import { getRelatedTemplateIds } from '../../utils/templates';
import RuleBreachesManager from '../ruleBreaches/manager';
import UsersManager from '../users/manager';
import WorkspaceService from '../workspaces/service';
import { patchDocumentAsStream } from './documentExport';
import { ExternalIdType, IExternalId } from './interface';

const { errorCodes, rabbit, ruleBreachService } = config;

class InstancesManager extends DefaultManagerProxy<InstancesService> {
    private entityTemplateService: EntityTemplateService;

    private storageService: StorageService;

    private semanticSearchSearch: SemanticSearchService;

    private ruleBreachesManager: RuleBreachesManager;

    private rabbitManager: RabbitManager;

    private workspaceId: string;

    private previewService: PreviewService;

    private dashboardItemService: DashboardItemService;

    private chartService: ChartService;

    constructor(workspaceId: string) {
        super(new InstancesService(workspaceId));
        this.workspaceId = workspaceId;
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.storageService = new StorageService(workspaceId);
        this.semanticSearchSearch = new SemanticSearchService(workspaceId);
        this.ruleBreachesManager = new RuleBreachesManager(workspaceId);
        this.rabbitManager = new RabbitManager(workspaceId);
        this.previewService = new PreviewService(workspaceId);
        this.dashboardItemService = new DashboardItemService(workspaceId);
        this.chartService = new ChartService(workspaceId);
    }

    async uploadInstanceFiles<TProps = Record<string, any>>(
        files: UploadedFile[],
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
                    props[key] = filesToUpload[key];
                }
            } else if (props) {
                props[key] = filesToUpload[key];
            }
        });

        return { props, files: filesToUpload };
    }

    async exportEntities(exportEntitiesBody: IExportEntitiesBody, userId: string) {
        const { workbook, filePath } = await createWorkbook(exportEntitiesBody.fileName);

        const workspace = await WorkspaceService.getById(this.workspaceId);
        const { path, name, type } = workspace;
        const workspacePath = `${path}/${name}${type}`;

        try {
            await this.addWorksheetsToWB(exportEntitiesBody, workbook, { path: workspacePath, id: this.workspaceId }, userId);
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
        userId: string,
    ): Promise<void> {
        const tasks = Object.entries(templates).map(
            async ([templateId, { filter, sort, displayColumns, headersOnly, insertEntities, isChildTemplate }]) => {
                const template: TemplateItem = isChildTemplate
                    ? { type: EntityTemplateType.Child, metaData: await this.entityTemplateService.getChildTemplateById(templateId) }
                    : { type: EntityTemplateType.Parent, metaData: await this.entityTemplateService.getEntityTemplateById(templateId) };

                await this.createWorksheet(
                    workbook,
                    template,
                    filter,
                    sort,
                    textSearch,
                    workspace,
                    userId,
                    displayColumns,
                    headersOnly,
                    insertEntities,
                );
            },
        );

        await Promise.all(tasks);
    }

    async searchEntitiesOfTemplate(
        templateId: string,
        searchBody: ISearchEntitiesOfTemplateBody & { entitiesWithFiles: ISemanticSearchResult[string] },
        userId: string,
        childTemplateIds?: string[],
        externalId?: IExternalId,
    ) {
        const { entitiesWithFiles, filter: defaultFilter, ...body } = searchBody;
        const [currentUser, units] = await Promise.all([UserService.getUserById(userId), UserService.getUnits({ workspaceId: this.workspaceId })]);

        let mergedFilterChildren: ISearchFilter | undefined;

        if (childTemplateIds?.length) {
            const [childTemplates, workspaceHierarchyIds] = await Promise.all([
                await this.entityTemplateService.searchChildTemplates({ ids: childTemplateIds }),
                WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId),
            ]);

            const childTemplatesFilters = childTemplates.map((childTemplate) =>
                getDefaultFilterFromChildTemplate(
                    childTemplate,
                    currentUser.kartoffelId,
                    UsersManager.getUnitsWithInheritance(units, currentUser.units?.[this.workspaceId] ?? []),
                    isAdmin(currentUser?.permissions, workspaceHierarchyIds),
                ),
            );
            mergedFilterChildren = getFilterModal(childTemplatesFilters, FilterLogicalOperator.OR);
        }

        let dashboardFilters: ISearchFilter | undefined;
        if (externalId) {
            if (externalId.type === ExternalIdType.chart) {
                const chart = await this.chartService.getChartById(externalId.id);
                dashboardFilters = chart.filter ? JSON.parse(chart.filter) : undefined;
            } else {
                const dashboard = await this.dashboardItemService.getDashboardItemById(externalId.id);
                dashboardFilters = getDashboardFilters(dashboard);
            }
        }

        const filter = getFilterModal([mergedFilterChildren, defaultFilter, dashboardFilters]);

        if (!entitiesWithFiles || !Object.keys(entitiesWithFiles)?.length || !body.textSearch)
            return this.service.searchEntitiesOfTemplateRequest(templateId, { ...body, filter });

        const searchResult = await this.service.searchEntitiesOfTemplateRequest(templateId, {
            ...body,
            filter,
            entityIdsToInclude: Object.keys(entitiesWithFiles),
        });

        if (body.sort?.length) return searchResult;

        const texts = createTextsFromEntitiesWithFiles(searchResult, entitiesWithFiles, body.textSearch);
        const reRank = await this.semanticSearchSearch.rerank({ query: body.textSearch, texts: Object.keys(texts) });

        if (!reRank?.length) return searchResult;

        return { ...searchResult, entities: sortEntities(searchResult.entities, reRank, texts) };
    }

    async getAllTemplateEntities(templateId: string, childTemplateId?: string) {
        const { searchEntitiesChunkSize } = config.service;

        let filter: ISearchFilter | undefined;
        if (childTemplateId) {
            const childTemplate = await this.entityTemplateService.getChildTemplateById(childTemplateId);
            filter = getFilterFromChildTemplate(childTemplate);
        }

        const { count } = await this.service.searchEntitiesOfTemplateRequest(templateId, {
            skip: 0,
            limit: 1,
            filter,
            showRelationships: false,
            sort: [],
        });

        const entities: IEntityWithDirectRelationships[] = [];

        for (let skip = 0; (count ?? 0) - skip > 0; skip += searchEntitiesChunkSize) {
            const { entities: chunk } = await this.service.searchEntitiesOfTemplateRequest(templateId, {
                skip,
                limit: searchEntitiesChunkSize,
                showRelationships: true,
                sort: [],
                filter,
            });
            entities.push(...chunk);
        }
        return entities;
    }

    private async getRelatedTemplates(template: IMongoChildTemplatePopulated | IMongoEntityTemplatePopulated, userId: string) {
        const relatedTemplatesObject = Object.entries(template.properties.properties)
            .filter(([, property]) => property.format === 'relationshipReference' && property.relationshipReference?.relatedTemplateId)
            .map(([fieldName, property]) => ({
                fieldName,
                relatedTemplateId: property.relationshipReference!.relatedTemplateId,
            }));

        const relatedTemplates = await this.entityTemplateService.searchEntityTemplates(userId, {
            ids: relatedTemplatesObject.map((relatedTemplate) => relatedTemplate.relatedTemplateId),
        });

        const relatedTemplatesMap = keyBy(relatedTemplates, '_id');

        return { relatedTemplatesObject, relatedTemplatesMap };
    }

    private fixInsertEntities(
        template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
        insertEntities: Record<string, any>[],
        displayColumns?: string[],
    ) {
        let newDisplayColumns = displayColumns;
        const newEntities = insertEntities.map((entity) => {
            Object.entries(template.properties.properties).forEach(([key, value]) => {
                if (!isIncludedColumn(value)) {
                    if (displayColumns) newDisplayColumns = newDisplayColumns?.filter((fieldName) => fieldName !== key);

                    delete entity[key];
                }
            });

            return entity;
        });

        return { newDisplayColumns, newEntities };
    }

    private async createWorksheet(
        workbook: stream.xlsx.WorkbookWriter,
        templateItem: TemplateItem,
        filter: ISearchFilter | undefined,
        sort: ISearchSort | undefined,
        textSearch: string | undefined,
        workspace: { path: string; id: string },
        userId: string,
        displayColumns?: string[],
        headersOnly?: boolean,
        insertEntities?: Record<string, any>[],
    ) {
        const { type, metaData: template } = templateItem;
        const parentTemplate = type === EntityTemplateType.Child ? template.parentTemplate : template;
        const { requiredConstraints } = await this.service.getConstraintsOfTemplate(parentTemplate._id);

        const { relatedTemplatesMap } = await this.getRelatedTemplates(template, userId);

        const worksheet = await createWorksheet(
            workbook,
            templateItem,
            relatedTemplatesMap,
            requiredConstraints,
            displayColumns,
            headersOnly || !!insertEntities,
        );
        const { searchEntitiesChunkSize } = config.service;

        if (headersOnly) return;

        const units = await UserService.getUnits({ workspaceId: this.workspaceId });
        const unitsMap = new Map(units.map((unit) => [unit._id, unit.name]));

        if (insertEntities) {
            const { newEntities: entitiesToInsert, newDisplayColumns: columnDisplay } = this.fixInsertEntities(
                template,
                insertEntities,
                displayColumns,
            );

            styleAWorksheet(worksheet, entitiesToInsert, templateItem, workspace, unitsMap, columnDisplay, undefined, !!entitiesToInsert);
            return;
        }

        const filters = type === EntityTemplateType.Parent ? filter : combineFilters(getFilterFromChildTemplate(template), filter);

        const { count } = await this.service.searchEntitiesOfTemplateRequest(parentTemplate._id, {
            skip: 0,
            limit: 1,
            textSearch,
            filter: filters,
            showRelationships: false,
            sort: sort || [],
        });

        // Remove the ?? 0 because it create infinite loop
        for (let skip = 0; (count ?? 0) - skip > 0; skip += searchEntitiesChunkSize) {
            const { entities: chunk } = await this.service.searchEntitiesOfTemplateRequest(parentTemplate._id, {
                skip,
                limit: searchEntitiesChunkSize,
                textSearch,
                filter: filters,
                showRelationships: false,
                sort: sort || [],
            });
            styleAWorksheet(
                worksheet,
                chunk.map((row) => row.entity.properties),
                templateItem,
                workspace,
                unitsMap,
                displayColumns,
                headersOnly,
                undefined,
                skip,
            );
        }
    }

    updateTemplateCurrentNumbers = async (template: IFullMongoEntityTemplate, serialStarters: Record<string, number>, succeededIndex: number) => {
        const serialProperties = Object.entries(template.properties.properties)
            .filter(([_key, value]) => value.type === 'number' && !!value.serialCurrent)
            .reduce((acc, [key, value]) => {
                acc[key] = { ...value, serialCurrent: serialStarters[key] + succeededIndex };
                return acc;
            }, {});
        const { category, _id, createdAt: _createdAt, updatedAt: _updatedAt, disabled: _disabled, ...restOfEntityTemplate } = template;
        await this.entityTemplateService.updateEntityTemplate(template._id, {
            ...restOfEntityTemplate,
            category,
            properties: {
                ...template.properties,
                properties: { ...template.properties.properties, ...serialProperties },
            },
        });
    };

    private async handleTemplate(templateId: string, childTemplateId?: string) {
        const templateItem: TemplateItem = childTemplateId
            ? { type: EntityTemplateType.Child, metaData: await this.entityTemplateService.getChildTemplateById(childTemplateId) }
            : { type: EntityTemplateType.Parent, metaData: await this.entityTemplateService.getEntityTemplateById(templateId) };

        return templateItem;
    }

    async handleRelationshipRefLoadExcel(
        template: IMongoChildTemplatePopulated | IMongoEntityTemplatePopulated,
        userId: string,
        entities: IEntityWithIgnoredRules[] | undefined,
    ) {
        const { relatedTemplatesMap, relatedTemplatesObject } = await this.getRelatedTemplates(template, userId);

        const searchBody: ISearchBatchBody = { skip: 0, limit: entities!.length * relatedTemplatesObject.length, templates: {} };
        const relatedTemplatesWithIdentifier: { fieldName: string; relatedTemplateId: string; identifierField: string }[] = [];
        const orFiltersByTemplate: Record<string, ISearchFilter> = {};

        relatedTemplatesObject.forEach(({ fieldName, relatedTemplateId }) => {
            const relatedTemplate: IMongoEntityTemplatePopulated = relatedTemplatesMap[relatedTemplateId!]!;
            const identifierField = Object.entries(relatedTemplate?.properties.properties).find(([_key, value]) => value.identifier)?.[0];
            if (!identifierField) return;

            relatedTemplatesWithIdentifier.push({ fieldName, relatedTemplateId, identifierField });

            const entitiesValues = entities?.map((entity) => entity.properties[fieldName]).filter((value) => value !== undefined && value !== null);
            if (!entitiesValues?.length) return;

            const newOrFilters = {
                $or: entitiesValues.map((value) => ({
                    [identifierField]: { $eq: value },
                })),
            };

            const existingOr = orFiltersByTemplate[relatedTemplateId]?.[FilterLogicalOperator.OR] ?? [];
            orFiltersByTemplate[relatedTemplateId] = {
                [FilterLogicalOperator.OR]: [...existingOr, ...newOrFilters.$or],
            };

            const templateFilter: ISearchFilter = {
                $and: [{ disabled: { $eq: false } }, orFiltersByTemplate[relatedTemplateId]],
            };
            searchBody.templates = {
                ...searchBody.templates,
                [relatedTemplateId]: {
                    filter: templateFilter,
                    showRelationships: false,
                },
            };
        });

        const searchResults: ISearchResult =
            relatedTemplatesWithIdentifier.length && Object.keys(searchBody.templates).length
                ? await this.service.searchEntitiesBatch(searchBody)
                : { count: 0, entities: [] };

        return { searchResults, relatedTemplatesWithIdentifier };
    }

    async loadEntities(
        templateId: string,
        userId: string,
        childTemplateId?: string,
        files?: UploadedFile[],
        insertBrokenEntities?: IEntityWithIgnoredRules[],
    ) {
        let entities = insertBrokenEntities;
        const { metaData: template, type } = await this.handleTemplate(templateId, childTemplateId);
        const { relatedTemplatesMap } = await this.getRelatedTemplates(template, userId);

        const failedEntities: IFailedEntity[] = [];

        if (files && !entities) {
            const workspace = await WorkspaceService.getById(this.workspaceId);
            entities = await getAllEntitiesFromExcel(files, template, failedEntities, workspace, relatedTemplatesMap);
        }

        const serialStarters = getSerialStarters(template);
        const succeededEntities: IEntity[] = [];
        const allBrokenRulesEntities: IBrokenRuleEntity[] = [];
        const usersFieldsMap = await getUserFields(template, entities);

        const { searchResults, relatedTemplatesWithIdentifier } = await this.handleRelationshipRefLoadExcel(template, userId, entities);

        const handleCreateEntity = async (entityWithIgnoredRules: IEntityWithIgnoredRules) => {
            const { ignoredRules, ...entity } = entityWithIgnoredRules;
            const originalProperties = { ...entity.properties };

            try {
                const serialNumbers = generateSerialNumbers(succeededEntities.length, serialStarters);

                if (relatedTemplatesWithIdentifier.length) {
                    Object.entries(entity.properties).forEach(([key, value]) => {
                        if (value === undefined || value === null) return;

                        const relatedTemplate = relatedTemplatesWithIdentifier.find((rel) => rel.fieldName === key && rel.identifierField);
                        if (!relatedTemplate) return;

                        const { identifierField, relatedTemplateId } = relatedTemplate;

                        const foundEntity = searchResults.entities.find(
                            ({ entity: result }) => result.templateId === relatedTemplateId && result.properties[identifierField] === value,
                        );

                        if (!foundEntity)
                            throw new NotFoundError(`Related entity not found for ${key} with value ${value}`, {
                                type: NotFoundErrorTypes.relationshipRefNotFound,
                                property: key,
                                relatedTemplateId,
                                relatedIdentifier: identifierField,
                            });

                        entity.properties = { ...entity.properties, [key]: foundEntity ? foundEntity.entity.properties._id : undefined };
                    });
                }

                await handleUserFields(template, entity.properties, usersFieldsMap);

                const result = await this.createEntityInstance(entity, [], ignoredRules, userId, childTemplateId, serialNumbers);

                succeededEntities.push(result);
            } catch (error) {
                classifyEntityErrors(error, failedEntities, entity, allBrokenRulesEntities, originalProperties);
            }
        };
        if (Object.keys(serialStarters).length > 0) for (const entity of entities!) await handleCreateEntity(entity);
        else await Promise.all(entities!.map(async (entity) => handleCreateEntity(entity)));

        const brokenRulesEntities = await convertIdOfBrokenRules(allBrokenRulesEntities);
        if (serialStarters)
            await this.updateTemplateCurrentNumbers(
                type === EntityTemplateType.Child ? template.parentTemplate : { ...template, category: template.category._id },
                serialStarters,
                succeededEntities.length,
            );

        return { succeededEntities, failedEntities, brokenRulesEntities };
    }

    async getChangedEntitiesFromExcel(templateId: string, file: UploadedFile, userId: string, childTemplateId?: string) {
        const { metaData: template, type } = await this.handleTemplate(templateId, childTemplateId);
        const { relatedTemplatesMap } = await this.getRelatedTemplates(template, userId);

        const failedEntities: IFailedEntity[] = [];
        const workspace = await WorkspaceService.getById(this.workspaceId);

        const oldEntities = await this.getAllTemplateEntities(templateId, childTemplateId);

        const entitiesWithIgnoresRules = await readExcelFile(
            [file],
            template,
            failedEntities,
            relatedTemplatesMap,
            this.workspaceId,
            workspace.metadata?.excel?.entitiesFileLimit,
            oldEntities,
        );

        const entities = entitiesWithIgnoresRules.map(({ properties }) => ({
            templateId: type === EntityTemplateType.Child ? template.parentTemplate?._id : templateId,
            properties,
        }));

        return { entities, failedEntities };
    }

    async editManyEntitiesByExcel(entities: IEntityWithIgnoredRules[], userId: string, childTemplateId?: string) {
        const failedEntities: IFailedEntity[] = [];
        const succeededEntities: IEntity[] = [];
        const allBrokenRulesEntities: IBrokenRuleEntity[] = [];
        const results: IEntity[] = [];

        const handleUpdateEntity = async (entity: IEntityWithIgnoredRules) => {
            try {
                const result = await this.updateEntityInstance(
                    entity.properties._id,
                    entity,
                    [],
                    entity.ignoredRules || [],
                    userId,
                    childTemplateId,
                    true,
                    true,
                );
                results.push(result);
            } catch (error) {
                classifyEntityErrors(error, failedEntities, entity, allBrokenRulesEntities);
            }
        };

        await Promise.all(entities.map(async (entity) => handleUpdateEntity(entity)));

        succeededEntities.push(...results);

        const brokenRulesEntities = await convertIdOfBrokenRules(allBrokenRulesEntities);

        return { succeededEntities, failedEntities, brokenRulesEntities };
    }

    private convertEntities(template: IMongoEntityTemplatePopulated, key: string, property: any) {
        switch (template.properties.properties[key]?.format) {
            case 'relationshipReference': {
                console.log({ property });

                return property?.properties._id;
            }
            case 'location': {
                if (!property) return undefined;
                const location = typeof property === 'string' && property.includes('location') ? JSON.parse(property) : property;
                return JSON.stringify(location);
            }
            case 'signature':
                return undefined;
            case 'date': {
                if (!property) return undefined;
                return new Date(property).toISOString().split('T')[0];
            }
            case 'date-time': {
                if (!property) return undefined;
                return new Date(property).toISOString();
            }
            default:
                return property;
        }
    }

    async updateMultipleEntities(
        updatedInstanceData: IEntity,
        propertiesToRemove: string[],
        entitiesToUpdate: IMultipleSelect<boolean>,
        files: UploadedFile[],
        ignoredRules: Record<string, IBrokenRule[]>,
        userId: string,
        childTemplateId?: string,
    ) {
        const failedEntities: IFailedEntity[] = [];
        const succeededEntities: IEntity[] = [];
        const allBrokenRulesEntities: IBrokenRuleEntity[] = [];
        const results: IEntity[] = [];
        const expandedEntities = await this.service.getEntitiesWithDirectRelationships(entitiesToUpdate, updatedInstanceData.templateId);
        const template = await this.entityTemplateService.getEntityTemplateById(updatedInstanceData.templateId);

        const handleUpdateEntity = async ({ entity }: IEntityWithDirectRelationships) => {
            const convertedProperties = mapValues(entity.properties, (property, key) => this.convertEntities(template, key, property));

            const propToUpdate: IEntity = {
                properties: omit({ ...convertedProperties, ...updatedInstanceData.properties }, propertiesToRemove),
                templateId: updatedInstanceData.templateId,
            };

            try {
                const result = await this.updateEntityInstance(
                    entity.properties._id,
                    propToUpdate,
                    files,
                    ignoredRules[entity.properties._id] || [],
                    userId,
                    childTemplateId,
                    true,
                    false,
                );
                results.push(result);
            } catch (error) {
                classifyEntityErrors(error, failedEntities, entity, allBrokenRulesEntities);
            }
        };

        await pMap(expandedEntities, handleUpdateEntity, { concurrency: 5 });
        succeededEntities.push(...results);

        return { succeededEntities, failedEntities, brokenRulesEntities: allBrokenRulesEntities };
    }

    getEntityFileProperties(entityProperties: IEntity['properties'], template: IEntityTemplatePopulated): Record<string, string | string[]> {
        return objectFilter(entityProperties, (key) => {
            const propertyTemplate = template.properties.properties[key];
            const fileFormats = ['fileId', 'signature'];
            return propertyTemplate && (fileFormats.includes(propertyTemplate.format ?? '') || propertyTemplate.items?.format === 'fileId');
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
            const { category, _id, createdAt: _createdAt, updatedAt: _updatedAt, disabled: _disabled, ...restOfEntityTemplate } = entityTemplate;
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

    async handlePreparationsBeforeCreateEntity(instanceData: IEntity, files: UploadedFile[], serialNumbers?: Record<string, number>) {
        const { props: propertiesWithFiles, files: upserstedFiles } = await this.uploadInstanceFiles(files, instanceData.properties);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(instanceData.templateId);

        if (!serialNumbers && entityTemplate.disabled) throw new BadRequestError('cannot create, entity template disabled');

        const newInstanceProperties = await this.setSerialPropertiesAndUpdateTemplate(propertiesWithFiles, entityTemplate, serialNumbers);

        return {
            templateId: instanceData.templateId,
            properties: newInstanceProperties,
            files: upserstedFiles,
        };
    }

    private async updateWalletBalance(
        walletProperty: IEntitySingleProperty,
        entityProperties: IEntity['properties'],
        amount: number,
        ignoredRules: IBrokenRule[],
        userId: string,
        childTemplateId?: string,
        isSourceWallet = true,
    ) {
        if (walletProperty.format !== 'relationshipReference') return;

        const walletTemplateId = walletProperty.relationshipReference?.relatedTemplateId ?? '';
        const walletTemplate = await this.entityTemplateService.getEntityTemplateById(walletTemplateId);

        const accountBalancePropertyKey = Object.entries(walletTemplate.properties.properties).find(([_key, prop]) => prop.accountBalance)?.[0];

        if (!accountBalancePropertyKey) {
            throw new Error('The transfer target is not a wallet template');
        }

        const walletProperties = entityProperties.properties;
        const { createdAt: _createdAt, updatedAt: _updatedAt, _id, disabled: _disabled, ...restWalletProperties } = walletProperties;

        const updatedAccountBalance = (walletProperties[accountBalancePropertyKey] || 0) + amount;

        if (isSourceWallet && (walletProperties[accountBalancePropertyKey] <= 0 || walletProperties[accountBalancePropertyKey] + amount < 0)) {
            throw new Error('Cannot transfer from a wallet with a negative balance');
        }
        console.log({
            properties: {
                ...restWalletProperties,
                [accountBalancePropertyKey]: updatedAccountBalance,
            },
        });

        return await this.updateEntityInstance(
            _id,
            {
                templateId: walletTemplateId,
                properties: {
                    ...restWalletProperties,
                    [accountBalancePropertyKey]: updatedAccountBalance,
                },
            },
            [],
            ignoredRules,
            userId,
            childTemplateId,
        );
    }

    async sendIndicatorRuleEmailForEntity(entity: IEntity, entityTemplate: IMongoEntityTemplatePopulated, userId: string, emails: IRuleMail[]) {
        const relatedTemplateIds = getRelatedTemplateIds(entityTemplate);
        const relatedTemplates = await this.entityTemplateService.searchEntityTemplates(userId, { ids: relatedTemplateIds });
        this.ruleBreachesManager.sendIndicatorEmailNotifications(
            emails,
            entity,
            userId,
            entityTemplate,
            new Map(relatedTemplates.map((relatedTemplate) => [relatedTemplate._id, relatedTemplate])),
        );
    }

    async sendIndicatorRuleEmailForCreation(createdEntity: IEntity, userId: string, emails: IRuleMail[]) {
        try {
            const entityTemplate: IMongoEntityTemplatePopulated = await this.entityTemplateService.getEntityTemplateById(createdEntity.templateId);
            await this.sendIndicatorRuleEmailForEntity(createdEntity, entityTemplate, userId, emails);
        } catch (error) {
            logger.error("Failed to send indicator rule's email for entity creation", { error });
        }
    }

    async updateWalletsBalanceInTransfer(
        createdEntity: IEntity,
        ignoredRules: IBrokenRule[],
        userId: string,
        entityTemplate: IMongoEntityTemplatePopulated,
        childTemplateId?: string,
    ) {
        const walletTransfer = entityTemplate.walletTransfer;
        if (!walletTransfer) {
            throw new Error('walletTransfer is missing in entityTemplate');
        }
        const { from, to, amount } = walletTransfer;
        const sourceProperty = entityTemplate.properties.properties[from];
        const destinationProperty = entityTemplate.properties.properties[to];
        const { properties } = createdEntity;
        const transferAmount = properties[amount];

        if (
            sourceProperty.format === 'relationshipReference' &&
            destinationProperty.format === 'relationshipReference' &&
            properties[from].properties._id === properties[to].properties._id
        )
            throw new Error('Source and destination wallets in the transfer are identical');

        const sourceWalletTemplate = await this.entityTemplateService.getEntityTemplateById(properties[from].templateId);
        const destWalletTemplate = await this.entityTemplateService.getEntityTemplateById(properties[to].templateId);

        console.dir(
            {
                toProps: createdEntity.properties[to].properties,
                fromProp: createdEntity.properties[from].properties,
                sourceWalletTemplate: sourceWalletTemplate.properties,
            },
            { depth: null },
        );
        const convertedFromProperties = mapValues(properties[from].properties, (property, key) => this.convertEntities(sourceWalletTemplate, key, property));
        const convertedToProperties = mapValues(properties[to].properties, (property, key) => this.convertEntities(destWalletTemplate, key, property));
        console.log({ convertedFromProperties, convertedToProperties });

        const source = await this.updateWalletBalance(
            sourceProperty,
            convertedFromProperties,
            -transferAmount,
            ignoredRules,
            userId,
            childTemplateId,
        );
        const destination = await this.updateWalletBalance(
            destinationProperty,
            convertedToProperties,
            transferAmount,
            ignoredRules,
            userId,
            childTemplateId,
            false,
        );
        return {
            ...createdEntity,
            ...(source && { [from]: source }),
            ...(destination && { [to]: destination }),
        };
    }

    async createEntityInstance(
        instanceData: IEntity,
        files: UploadedFile[],
        ignoredRules: IBrokenRule[],
        userId: string,
        childTemplateId?: string,
        serialNumbers?: Record<string, number>,
        createAlert: boolean = true,
    ) {
        const { templateId, properties, files: upserstedFiles } = await this.handlePreparationsBeforeCreateEntity(instanceData, files, serialNumbers);

        logger.info('createEntityInstance', { instanceData, files, ignoredRules, userId, serialNumbers, createAlert });

        const template = await this.entityTemplateService.getEntityTemplateById(instanceData.templateId);
        let newDestWalletData: IEntity | undefined = undefined;

        if (template.walletTransfer) {
            const isDestinationWallet = template.properties.properties[template.walletTransfer.to].format === 'relationshipReference';

            if (isDestinationWallet && instanceData.properties[template.walletTransfer.to] === '$twin') {
                const sourceWallet = await this.service.getEntityInstanceById(instanceData.properties[template.walletTransfer.from]);
                const sourceWalletTemplate = await this.entityTemplateService.getEntityTemplateById(sourceWallet.templateId);
                const convertedProperties = mapValues(sourceWallet.properties, (property, key) =>
                    this.convertEntities(sourceWalletTemplate, key, property),
                );
                console.log({ convertedProperties });

                newDestWalletData = {
                    ...sourceWallet,
                    templateId: template.properties.properties[template.walletTransfer.to].relationshipReference?.relatedTemplateId ?? '',
                    properties: { ...omit(convertedProperties, ['_id', 'createdAt', 'updatedAt']) },
                };
            }
        }

        const { createdEntity, actions, emails } = await this.service
            .createEntityInstance({ properties, templateId }, ignoredRules, userId, undefined, childTemplateId, newDestWalletData)
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
        } else await this.rabbitManager.indexFiles(createdEntity.templateId, createdEntity.properties._id, Object.values(upserstedFiles).flat());

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(createdEntity.templateId);

        const newEntity = entityTemplate.walletTransfer
            ? await this.updateWalletsBalanceInTransfer(createdEntity, ignoredRules, userId, entityTemplate, childTemplateId)
            : createdEntity;

        if (emails?.length) this.sendIndicatorRuleEmailForCreation(newEntity, userId, emails);

        return { ...newEntity, childTemplateId };
    }

    private async deleteUnusedFiles(currentEntity: IEntity, instanceData: IEntity, files: UploadedFile[]) {
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

        await this.rabbitManager.deleteFiles(fileIdsToDelete);
        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify({ fileIds: fileIdsToDelete, bucketName: this.workspaceId }));

        return fileIdsToDelete;
    }

    async exportEntityToDocumentTemplate({
        documentTemplateId,
        entity: { templateId, properties },
    }: {
        documentTemplateId: string;
        entity: IEntity;
    }) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);
        return patchDocumentAsStream(
            await this.storageService.downloadFile(documentTemplateId),
            properties,
            entityTemplate,
            async (path: string, contentType?: string) => this.previewService.getFilePreview(path, contentType),
        );
    }

    async searchEntitiesBatch(shouldSemanticSearch: boolean, searchBody: ISearchBatchBody) {
        const templatesWithoutChildId = Object.entries(searchBody.templates ?? {}).reduce(
            (acc, [templateId, { childTemplateId: _childTemplateId, ...rest }]) => {
                acc[templateId] = rest;
                return acc;
            },
            {} as typeof searchBody.templates,
        );

        if (!shouldSemanticSearch || !searchBody.textSearch) {
            return this.service.searchEntitiesBatch({ ...searchBody, templates: templatesWithoutChildId });
        }

        const semanticSearchResult = await this.semanticSearchSearch.search({
            textSearch: searchBody.textSearch,
            limit: searchBody.limit,
            skip: searchBody.skip,
            templates: Object.keys(templatesWithoutChildId),
        });

        const allResults = await this.service.searchEntitiesBatch({
            ...searchBody,
            templates: templatesWithoutChildId,
            entityIdsToInclude: semanticSearchResult ? Object.values(semanticSearchResult).flatMap(Object.keys) : undefined,
        });

        const { formattedEntities, textsForReranking } = formatEntitiesBulkSearch(allResults, searchBody.textSearch, semanticSearchResult);
        const rerank = await this.semanticSearchSearch.rerank({ query: searchBody.textSearch, texts: Object.keys(textsForReranking) });

        if (!rerank?.length) {
            return formattedEntities;
        }

        return { ...formattedEntities, entities: sortEntities(formattedEntities.entities, rerank, textsForReranking) };
    }

    async getEntitiesCountByTemplates(shouldSemanticSearch: boolean, searchBody: ITemplateSearchBody): Promise<ICountSearchResult[] | undefined> {
        const { childTemplateIds, ...restSearchBody } = searchBody;

        const parentTemplateIds = childTemplateIds?.length
            ? await Promise.all(
                  childTemplateIds.map(async (templateId) => {
                      const childTemplate = await this.entityTemplateService.getChildTemplateById(templateId);
                      return childTemplate?.parentTemplate._id;
                  }),
              )
            : [];

        const templateIds = [...parentTemplateIds, ...searchBody.templateIds];

        return this.service.getEntitiesCountByTemplates({
            ...restSearchBody,
            templateIds,
            semanticSearchResult:
                searchBody.textSearch && shouldSemanticSearch
                    ? await this.semanticSearchSearch.search({
                          textSearch: searchBody.textSearch,
                          templates: templateIds,
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
        files: UploadedFile[],
        ignoredRules: IBrokenRule[],
        userId: string,
        childTemplateId?: string,
        duplicateFileProperties = true,
        createAlert: boolean = true,
    ) {
        const currentEntity = await this.service.getEntityInstanceById(id);
        const currentEntityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        if (currentEntityTemplate.disabled) throw new BadRequestError("can't duplicate, entity template disabled");
        if (currentEntity.properties.disabled) throw new BadRequestError("can't duplicate disabled entity");

        const fileProperties = this.getEntityFileProperties(instanceData.properties, currentEntityTemplate);

        console.dir({ fileProperties }, { depth: null });

        let duplicatedFileProperties: Record<string, string | string[]> = {};
        if (duplicateFileProperties) {
            duplicatedFileProperties = await this.duplicateFileProperties(fileProperties, currentEntity);
        }

        console.dir({ duplicatedFileProperties }, { depth: null });

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
            .createEntityInstance(newInstanceData, ignoredRules, userId, id, childTemplateId)
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
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(createdEntity.templateId);
        if (entityTemplate.walletTransfer)
            await this.updateWalletsBalanceInTransfer(createdEntity, ignoredRules, userId, entityTemplate, childTemplateId);

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

    async sendIndicatorRuleEmailForUpdate(
        updatedEntity: IEntity,
        entityTemplate: IMongoEntityTemplatePopulated,
        userId: string,
        emails: IRuleMail[],
    ) {
        try {
            await this.sendIndicatorRuleEmailForEntity(updatedEntity, entityTemplate, userId, emails);
        } catch (error) {
            logger.error("Failed to send indicator rule's email for entity update", { error });
        }
    }

    async updateEntityInstance(
        id: string,
        updatedInstanceData: IEntity,
        files: UploadedFile[],
        ignoredRules: IBrokenRule[],
        userId: string,
        childTemplateId?: string,
        createAlert: boolean = true,
        isEditExcel: boolean = false,
    ) {
        const { props: uploadedFilesAndProperties, files: updatedFiles } = await this.uploadInstanceFiles(files, updatedInstanceData.properties);
        const currentEntity = await this.service.getEntityInstanceById(id);
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(currentEntity.templateId);

        if (entityTemplate.walletTransfer) throw new BadRequestError("can't update transfer entity template");

        if (!isEditExcel) {
            if (entityTemplate.disabled) throw new BadRequestError("can't update, entity template disabled");
            if (currentEntity.properties.disabled) throw new BadRequestError("can't update disabled entity");
        }
        this.checkSerialFieldWasUpdated(entityTemplate, updatedInstanceData.properties, currentEntity);

        const { updatedEntity, actions, emails } = await this.service
            .updateEntityInstance(
                id,
                {
                    templateId: updatedInstanceData.templateId,
                    properties: { ...uploadedFilesAndProperties },
                },
                ignoredRules,
                userId,
                childTemplateId,
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

        if (emails) this.sendIndicatorRuleEmailForUpdate(updatedEntity, entityTemplate, userId, emails);

        return updatedEntity;
    }

    private async deleteAllEntitiesFiles(fileIdsToRemove: string[]) {
        if (!fileIdsToRemove.length) return [];
        await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify({ fileIds: fileIdsToRemove, bucketName: this.workspaceId }));
        await this.rabbitManager.deleteFiles(fileIdsToRemove);

        return fileIdsToRemove;
    }

    async deleteEntityInstances(deleteBody: IDeleteEntityBody) {
        const { childTemplateId, templateId } = deleteBody;
        const template = childTemplateId
            ? await this.entityTemplateService.getChildTemplateById(childTemplateId)
            : await this.entityTemplateService.getEntityTemplateById(templateId);

        if (template.walletTransfer) throw new BadRequestError("can't delete transfer entity template");

        if (template.disabled) throw new BadRequestError('cannot delete entities with disabled template');
        if (!deleteBody.selectAll) {
            const entities = await Promise.all(
                (deleteBody as IDeleteEntityBody<false>).idsToInclude!.map((entityId) => this.service.getEntityInstanceById(entityId)),
            );
            const disabledEntity = entities.find((entity) => entity.properties.disabled === true);
            if (disabledEntity) throw new BadRequestError('cannot delete, some entities are disabled');
            if (childTemplateId) {
                const notFilterValid = entities.find((entity) =>
                    matchValueAgainstFilter(entity.properties, getFilterFromChildTemplate(template as IMongoChildTemplatePopulated)),
                );

                if (notFilterValid)
                    throw new FilterValidation(`cannot delete, entity ${notFilterValid.properties._id} is not valid according to filters`);
            }
        }

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

            const populatedBrokenRules = await this.ruleBreachesManager.populateBrokenRules(brokenRules);
            throw new BadRequestError(error.message, {
                errorCode: errorCodes.ruleBlock,
                brokenRules: populatedBrokenRules,
                rawBrokenRules: brokenRules,
                // in case that entityTemplate has actions
                ...(actions && {
                    actions: await this.ruleBreachesManager.populateActionsMetaData(actions, populatedBrokenRules),
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

    async getManyEntitiesNewPropertiesToUpdate(entitiesToUpdate: IEntity[], templatesByIds: Map<string, IMongoEntityTemplatePopulated>) {
        const entitiesNewPropertiesPromises = entitiesToUpdate.map(async (entityToUpdate) => {
            const entityTemplate = templatesByIds.get(entityToUpdate.templateId)!;

            return this.setSerialPropertiesAndUpdateTemplate(entityToUpdate.properties, entityTemplate).then((properties) => {
                return {
                    templateId: entityToUpdate.templateId,
                    properties,
                };
            });
        });

        return Promise.all(entitiesNewPropertiesPromises);
    }

    async getAllActionsTemplatesByIds(actionsGroups: IAction[][], userId: string) {
        const { templateIds: templateIdsFromReq, entitiesIds } = this.extractEntitiesAndTemplatesIds(actionsGroups as IAction[][]);
        const templateIds = new Set<string>([...templateIdsFromReq]);

        const entities = await this.service.getEntityInstancesByIds(entitiesIds);
        entities.forEach((entity) => templateIds.add(entity.templateId));

        const templates = await this.entityTemplateService.searchEntityTemplates(userId, { ids: [...templateIds] });

        return {
            templatesByIds: new Map(templates.map((template) => [template._id, template])),
            entitiesByIds: new Map(entities.map((entity) => [entity.properties._id, entity])),
        };
    }

    async sendBulkEmails(
        emailsByInstance: Record<string, IBulkRuleMail[]>,
        userId: string,
        templatesByIds: Map<string, IMongoEntityTemplatePopulated>,
    ) {
        const relatedTemplateIds = new Set<string>(Array.from(templatesByIds.values()).flatMap((template) => getRelatedTemplateIds(template)));
        const relatedTemplates =
            relatedTemplateIds.size === 0
                ? []
                : await this.entityTemplateService.searchEntityTemplates(userId, { ids: Array.from(relatedTemplateIds) });
        const relatedTemplatesByIds = new Map(relatedTemplates.map((relatedTemplate) => [relatedTemplate._id, relatedTemplate]));

        Object.values(emailsByInstance).forEach((emails) => {
            const entity = emails[0]?.entity;
            if (entity)
                this.ruleBreachesManager.sendIndicatorEmailNotifications(
                    emails as IRuleMail[],
                    emails[0].entity,
                    userId,
                    templatesByIds.get(entity.templateId)!,
                    relatedTemplatesByIds,
                );
        });
    }

    async runBulkOfActions(actionsGroups: IAction[][], dryRun: boolean, userId: string, ignoredRules: IBrokenRule[] = []) {
        const { templatesByIds, entitiesByIds } = await this.getAllActionsTemplatesByIds(actionsGroups, userId);
        const entitiesToCreate: IEntity[] = [];

        actionsGroups.forEach((actionGroup) =>
            actionGroup.forEach((action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    const instanceData = action.actionMetadata as ICreateEntityMetadata;

                    // TODO - for now we are not support upload files in bulk, we will support it in the future
                    entitiesToCreate.push(instanceData);
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    const entity = entitiesByIds.get(actionMetadata.entityId)!;
                    const templateOfEntity = templatesByIds.get(entity.templateId)!;

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

        const bulkResults: PromiseSettledResult<IBulkOfActions>[] = await this.service.runBulkOfActions(
            newActionsGroups,
            dryRun,
            userId,
            ignoredRules,
        );
        const emailsByInstance: Record<string, IBulkRuleMail[]> = {};

        const reducedBulk = bulkResults.reduce<PromiseSettledResult<IEntity | IRelationship[]>[]>((acc, curr) => {
            if (curr.status === 'fulfilled') {
                const { emails } = curr.value;
                emails.forEach((email) => {
                    const entityId = email.entity.properties._id;
                    emailsByInstance[entityId] = [email, ...(emailsByInstance[entityId] ?? [])];
                });

                acc.push({
                    status: 'fulfilled',
                    value: curr.value.instances,
                });
            } else {
                acc.push({
                    status: 'rejected',
                    reason: curr.reason,
                });
            }

            return acc;
        }, []);

        this.sendBulkEmails(emailsByInstance, userId, templatesByIds);

        return reducedBulk;
    }

    async searchEntitiesByLocation(reqBody: ISearchEntitiesByLocationBody, userId: string) {
        const entityTemplates = await this.entityTemplateService.searchEntityTemplates(userId, { ids: Object.keys(reqBody.templates) });

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

    async getChartOfTemplate(templateId: string, body: { chartsData: IChartBody[]; childTemplateId?: string }) {
        const units = await UserService.getUnits({ workspaceId: this.workspaceId });

        return this.service.getChartsOfTemplate(templateId, body, units);
    }
}

export default InstancesManager;
