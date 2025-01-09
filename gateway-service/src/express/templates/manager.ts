/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { AxiosError, AxiosResponse } from 'axios';
import _isEqual from 'lodash.isequal';
import lodashUniqby from 'lodash.uniqby';
import { StatusCodes } from 'http-status-codes';
import { logger } from 'elastic-apm-node';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { IConstraintsOfTemplate, IUniqueConstraintOfTemplate } from '../../externalServices/instanceService/interfaces/entities';
import { ProcessService } from '../../externalServices/processService';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import { StorageService } from '../../externalServices/storageService';
import {
    EntityTemplateService,
    ICategory,
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplatesBody,
} from '../../externalServices/templates/entityTemplateService';
import {
    IMongoRelationshipTemplate,
    IRelationshipTemplate,
    ISearchRelationshipTemplatesBody,
    ISearchRulesBody,
    RelationshipsTemplateService,
} from '../../externalServices/templates/relationshipsTemplateService';
import { PermissionType } from '../../externalServices/userService/interfaces/permissions';
import { trycatch } from '../../utils';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import { BadRequestError, NotFoundError, ServiceError } from '../error';
import ProcessTemplatesManager from '../processes/processTemplates/manager';
import { UsersManager } from '../users/manager';
import {
    IEntityTemplateWithConstraints,
    IMongoEntityTemplateWithConstraints,
    IMongoEntityTemplateWithConstraintsPopulated,
    IUpdateOrDeleteEnumFieldReqData,
} from './interfaces';
import { getParametersOfFormula } from './rules';
import { IMongoRule, IRule } from './rules/interfaces';
import { IFormula } from './rules/interfaces/formula';
import { GanttsService } from '../../externalServices/ganttsService';
import { checkPropertyInUsedFromFormula } from './rules/checkIfPropertyInUsed';
import { UploadedFile } from '../../utils/busboy/interface';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { buildNewRelationshipField, validateNoDependentRules, validateRequiredConstraints, validateUniqueRelationships } from '../../utils/templates';

const {
    categoryHasTemplates,
    entityTemplateHasOutgoingRelationships,
    entityTemplateHasIncomingRelationships,
    entityTemplateHasInstances,
    relationshipTemplateHasInstances,
    relationshipTemplateHasRules,
    ruleHasAlertsOrRequests,
} = config.errorCodes;

const { NOT_FOUND: notFoundStatus, INTERNAL_SERVER_ERROR: internalServerErrorStatus } = StatusCodes;

export class TemplatesManager extends DefaultManagerProxy<EntityTemplateService> {
    private storageService: StorageService;

    private relationshipTemplateService: RelationshipsTemplateService;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private processService: ProcessService;

    private processManager: ProcessTemplatesManager;

    private ruleBreachService: RuleBreachService;

    private ganttService: GanttsService;

    constructor(private workspaceId: string) {
        super(new EntityTemplateService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.processService = new ProcessService(workspaceId);
        this.processManager = new ProcessTemplatesManager(workspaceId);
        this.ruleBreachService = new RuleBreachService(workspaceId);
        this.ganttService = new GanttsService(workspaceId);
    }

    async getAllowedEntityTemplateIds(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], searchBody?: any) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, searchBody);
        return allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);
    }

    async getAllowedRelationshipTemplates(entityTemplateIds: string[]) {
        const [bySource, byDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: entityTemplateIds }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: entityTemplateIds }),
        ]);

        return lodashUniqby([...bySource, ...byDestination], '_id');
    }

    async getAllowedTemplatesAndRules(entityTemplateIds: string[], relationshipTemplates: IRelationshipTemplate[]) {
        const allowedEntityTemplatesIdsByOneRelationship = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            relationshipTemplates,
            relationshipTemplates,
            entityTemplateIds,
        );

        const { allowedRelationshipTemplatesBecauseOfRules } = await this.getAllowedRules(
            entityTemplateIds,
            relationshipTemplates,
            allowedEntityTemplatesIdsByOneRelationship,
        );

        return { allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesIdsByOneRelationship };
    }

    // get all entityTemplates that are one relationship (step) away  from the original users permissions
    private getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
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

    private async getAllowedRules(
        allowedEntityTemplatesIds: string[],
        allowedRelationshipsTemplates: IRelationshipTemplate[],
        allowedEntityTemplatesIdsByOneRelationship: string[],
    ) {
        const allowedRelationshipsTemplatesIds = allowedRelationshipsTemplates.map(({ _id }) => _id);

        const rulesByAllowedEntityTemplates = await this.relationshipTemplateService.searchRules({
            entityTemplateIds: allowedEntityTemplatesIds,
        });

        /*
         * you need rules of entity templates of "by one relationship"
         * because you can break the rule if it has aggregation on the entity (entity.conncections.allowedEntityToEdit)
         * for example, say you have permissions only for people.
         * so you receive templates
         * 1. template of person - because you have direct permission
         * 2. template of flight - because there's relationship person<=>flight
         * 3!!!. template of trip - because there's a rule of flight that checks connected trip,
         *    and flight is the entity of the rule, and the rule might contain aggregation of "flight.flightsOn.person",
         *    and rule might break on person change
         */
        const rulesOfEntityTemplatesByOneRelationship = await this.relationshipTemplateService.searchRules({
            entityTemplateIds: allowedEntityTemplatesIdsByOneRelationship,
        });

        const allowedRules: IRule[] = lodashUniqby([...rulesByAllowedEntityTemplates, ...rulesOfEntityTemplatesByOneRelationship], '_id');

        const parametersOfRulesOfEntityTemplatesByOneRelationship = rulesOfEntityTemplatesByOneRelationship.flatMap(({ formula }) =>
            getParametersOfFormula(formula),
        );

        const allowedRelationshipTemplatesIdsBecauseOfRules = parametersOfRulesOfEntityTemplatesByOneRelationship
            .filter(
                ({ variable }) =>
                    variable.aggregatedRelationship &&
                    !allowedRelationshipsTemplatesIds.includes(variable.aggregatedRelationship.relationshipTemplateId),
            )
            .map(({ variable }) => variable.aggregatedRelationship!.relationshipTemplateId);

        const allowedRelationshipTemplatesBecauseOfRules = await this.relationshipTemplateService.searchRelationshipTemplates({
            ids: [...new Set(allowedRelationshipTemplatesIdsBecauseOfRules)],
        });

        const allowedEntityTemplatesIdsBecauseOfRules = parametersOfRulesOfEntityTemplatesByOneRelationship
            .filter(
                ({ variable }) =>
                    variable.aggregatedRelationship && !allowedEntityTemplatesIds.includes(variable.aggregatedRelationship.otherEntityTemplateId),
            )
            .map(({ variable }) => variable.aggregatedRelationship!.otherEntityTemplateId);

        const allowedEntityTemplatesBecauseOfRules = await this.entityTemplateService.searchEntityTemplates({
            ids: allowedEntityTemplatesIdsBecauseOfRules,
        });

        return {
            allowedRules,
            allowedRelationshipTemplatesBecauseOfRules,
            allowedEntityTemplatesBecauseOfRules,
        };
    }

    // all
    async getAllAllowedTemplates(userId: string, permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId']) {
        const [allCategories, allowedEntityTemplates] = await Promise.all([
            this.getAllCategories(),
            this.getAllowedEntitiesTemplates(permissionsOfUserId),
        ]);

        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const allowedRelationshipsTemplates = await this.getAllowedRelationshipTemplates(allowedEntityTemplatesIds);
        const { allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesIdsByOneRelationship } = await this.getAllowedTemplatesAndRules(
            allowedEntityTemplatesIds,
            allowedRelationshipsTemplates,
        );

        const [allowedEntityTemplatesByOneRelationship, { allowedRules, allowedEntityTemplatesBecauseOfRules }, processTemplatesBeforePopulate] =
            await Promise.all([
                this.entityTemplateService.searchEntityTemplates({ ids: allowedEntityTemplatesIdsByOneRelationship }),
                this.getAllowedRules(allowedEntityTemplatesIds, allowedRelationshipsTemplates, allowedEntityTemplatesIdsByOneRelationship),
                this.processService.searchProcessTemplates(permissionsOfUserId.admin || permissionsOfUserId.processes ? {} : { reviewerId: userId }),
            ]);

        const allAllowedEntityTemplates = [
            ...allowedEntityTemplates,
            ...allowedEntityTemplatesByOneRelationship,
            ...allowedEntityTemplatesBecauseOfRules,
        ].filter((template): template is IMongoEntityTemplatePopulated => !!template && typeof template !== 'string');

        const [allAllowedEntityTemplatesWithConstraints, ...processTemplates] = await Promise.all([
            this.getAndPopulateAllTemplatesConstraints(allAllowedEntityTemplates),
            ...processTemplatesBeforePopulate.map((processTemplate) => this.processManager.getTemplateWithPopulatedStepReviewers(processTemplate)),
        ]);

        return {
            categories: allCategories,
            entityTemplates: allAllowedEntityTemplatesWithConstraints,
            relationshipTemplates: [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules],
            rules: allowedRules,
            processTemplates,
        };
    }

    getAllRelationshipTemplates() {
        return this.relationshipTemplateService.searchRelationshipTemplates();
    }

    async getAllAllowedEntityTemplates(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId']) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId);
        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const [allowedRelationshipsTemplatesBySource, allowedRelationshipsTemplatesByDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: allowedEntityTemplatesIds }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: allowedEntityTemplatesIds }),
        ]);

        const allowedEntityTemplatesIdsByOneRelationship = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            allowedRelationshipsTemplatesBySource,
            allowedRelationshipsTemplatesByDestination,
            allowedEntityTemplatesIds,
        );

        const allowedEntityTemplatesByOneRelationship = await this.entityTemplateService.searchEntityTemplates({
            ids: allowedEntityTemplatesIdsByOneRelationship,
        });

        return [...allowedEntityTemplates, ...allowedEntityTemplatesByOneRelationship];
    }

    // categories
    async getAllCategories() {
        return this.entityTemplateService.getAllCategories();
    }

    async createCategory(categoryData: Omit<ICategory, 'iconFileId'>, file?: UploadedFile) {
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            return this.entityTemplateService.createCategory({ ...categoryData, iconFileId: newFileId });
        }

        return this.entityTemplateService.createCategory({ ...categoryData, iconFileId: null });
    }

    // TODO: race condition here
    async deleteCategory(id: string) {
        const templates = await this.entityTemplateService.searchEntityTemplates({ categoryIds: [id] });
        if (templates.length > 0) {
            throw new BadRequestError('category still has entity templates', { errorCode: categoryHasTemplates });
        }

        const category = await this.entityTemplateService.getCategoryById(id);

        // deleting first the category so if it will fail, the icon and the permissions wont be deleted
        await this.entityTemplateService.deleteCategory(id);

        if (category.iconFileId !== null) {
            await trycatch(() => this.storageService.deleteFile(category.iconFileId!));
        }

        await UsersManager.deletePermissionsFromMetadata(
            { workspaceId: this.workspaceId, type: PermissionType.instances },
            { instances: { categories: { [id]: null } } },
        ).catch(() => {});
    }

    async updateCategory(id: string, updatedData: Partial<ICategory> & { file?: string }, file?: UploadedFile) {
        const { iconFileId } = await this.entityTemplateService.getCategoryById(id);

        if (file) {
            if (iconFileId) {
                await this.storageService.deleteFile(iconFileId);
            }

            const newFileId = await this.storageService.uploadFile(file);

            return this.entityTemplateService.updateCategory(id, { ...updatedData, iconFileId: newFileId });
        }

        if (iconFileId && !updatedData.iconFileId) {
            await this.storageService.deleteFile(iconFileId);

            return this.entityTemplateService.updateCategory(id, { ...updatedData, iconFileId: null });
        }

        return this.entityTemplateService.updateCategory(id, updatedData);
    }

    // entity templates
    private populateTemplateConstraints(
        entityTemplate: IMongoEntityTemplatePopulated,
        requiredConstraints: string[],
        uniqueConstraints: IUniqueConstraintOfTemplate[],
    ): IMongoEntityTemplateWithConstraintsPopulated {
        return {
            ...entityTemplate,
            properties: {
                ...entityTemplate.properties,
                required: requiredConstraints,
            },
            uniqueConstraints,
        };
    }

    private async getAndPopulateAllTemplatesConstraints(entityTemplates: IMongoEntityTemplatePopulated[]) {
        const allConstraints = await this.instancesService.getAllConstraints();

        const entityTemplatesWithConstraints: IMongoEntityTemplateWithConstraintsPopulated[] = entityTemplates.map((entityTemplate) => {
            const constraintsOfTemplate = allConstraints.find(({ templateId }) => templateId === entityTemplate._id);
            return this.populateTemplateConstraints(
                entityTemplate,
                constraintsOfTemplate?.requiredConstraints ?? [],
                constraintsOfTemplate?.uniqueConstraints ?? [],
            );
        });

        return entityTemplatesWithConstraints;
    }

    async searchEntityTemplates(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], searchQuery: ISearchEntityTemplatesBody) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, searchQuery);
        return this.getAndPopulateAllTemplatesConstraints(allowedEntityTemplates);
    }

    async searchRelationshipTemplates(
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        searchBody: ISearchRelationshipTemplatesBody,
    ) {
        const allowedEntityTemplatesIds = await this.getAllowedEntityTemplateIds(permissionsOfUserId, searchBody);
        const allowedRelationshipsTemplates = await this.getAllowedRelationshipTemplates(allowedEntityTemplatesIds);

        const { allowedRelationshipTemplatesBecauseOfRules } = await this.getAllowedTemplatesAndRules(
            allowedEntityTemplatesIds,
            allowedRelationshipsTemplates,
        );

        return [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules];
    }

    async searchRulesTemplates(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], searchBody: ISearchRulesBody) {
        const allowedEntityTemplatesIds = await this.getAllowedEntityTemplateIds(permissionsOfUserId);
        const searchResults = await this.relationshipTemplateService.searchRules(searchBody);

        return searchResults.filter((rule) => allowedEntityTemplatesIds.includes(rule.entityTemplateId));
    }

    async createEntityTemplate(
        templateData: Omit<IEntityTemplateWithConstraints, 'iconFileId' | 'documentTemplatesIds'>,
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await this.entityTemplateService.getCategoryById(templateData.category);
        let iconFileId: string | null;

        if (file) {
            iconFileId = await this.storageService.uploadFile(file[0]);
        } else iconFileId = null;

        const { uniqueConstraints, properties, ...restOfTemplateData } = templateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        const entityTemplate = await this.entityTemplateService.createEntityTemplate({
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
            documentTemplatesIds: files ? await this.storageService.uploadFiles(files) : undefined,
        });

        await this.instancesService.updateConstraintsOfTemplate(entityTemplate._id, { requiredConstraints, uniqueConstraints });

        return this.populateTemplateConstraints(entityTemplate, requiredConstraints, uniqueConstraints);
    }

    entityHasRelationshipNotReference(entityTemplateToDelete: IMongoEntityTemplatePopulated, relastionships: IRelationshipTemplate[]) {
        return relastionships.some((relationship) => {
            const isUsedAsRelationshipReference =
                entityTemplateToDelete.properties.properties[relationship.name].relationshipReference?.relationshipTemplateId === relationship._id;

            return !isUsedAsRelationshipReference;
        });
    }

    // TODO: Move to template-service
    async throwIfEntityHasRelationships(entityTemplateToDelete: IMongoEntityTemplatePopulated) {
        const outgoingRelationships = await this.relationshipTemplateService.searchRelationshipTemplates({
            sourceEntityIds: [entityTemplateToDelete._id],
        });
        if (this.entityHasRelationshipNotReference(entityTemplateToDelete, outgoingRelationships)) {
            throw new BadRequestError('entity template still has outgoing relationships', {
                errorCode: entityTemplateHasOutgoingRelationships,
            });
        }

        const incomingRelationships = await this.relationshipTemplateService.searchRelationshipTemplates({
            destinationEntityIds: [entityTemplateToDelete._id],
        });
        if (this.entityHasRelationshipNotReference(entityTemplateToDelete, incomingRelationships)) {
            throw new BadRequestError('entity template still has incoming relationships', {
                errorCode: entityTemplateHasIncomingRelationships,
            });
        }
    }

    async throwIfEntityTemplateHasInstances(id: string) {
        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        if (count > 0) {
            throw new BadRequestError('entity template still has instances', { errorCode: entityTemplateHasInstances });
        }
    }

    async deleteEntityTemplate(id: string): Promise<IMongoEntityTemplateWithConstraints> {
        const entityTemplateToDelete = await this.entityTemplateService.getEntityTemplateById(id);
        await this.throwIfEntityHasRelationships(entityTemplateToDelete);
        await this.throwIfEntityTemplateHasInstances(id);

        if (entityTemplateToDelete.iconFileId) {
            await this.storageService.deleteFile(entityTemplateToDelete.iconFileId);
        }

        await this.instancesService.updateConstraintsOfTemplate(id, { requiredConstraints: [], uniqueConstraints: [] });

        const entityTemplate = await this.entityTemplateService.deleteEntityTemplate(id);

        return {
            ...entityTemplate,
            properties: {
                ...entityTemplate.properties,
                required: [],
            },
            uniqueConstraints: [],
        };
    }

    async updateNewSerialNumberFields(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'>,
        currTemplate: IMongoEntityTemplatePopulated,
    ) {
        const updatedSerialNumberFields = Object.keys(updatedTemplateData.properties.properties).filter(
            (key) => updatedTemplateData.properties.properties[key].serialCurrent !== undefined,
        );

        // eslint-disable-next-line no-prototype-builtins
        const newSerialNumberFields = updatedSerialNumberFields.filter((key) => !currTemplate.properties.properties.hasOwnProperty(key));

        if (newSerialNumberFields.length) {
            const newSerialNumberValues = {};
            newSerialNumberFields.forEach((key) => {
                newSerialNumberValues[key] = updatedTemplateData.properties.properties[key].serialCurrent;
            });

            const numOfInstancesUpdated: number = await this.instancesService.enumerateNewSerialNumberFields(id, newSerialNumberValues);

            newSerialNumberFields.forEach((key) => {
                updatedTemplateData.properties.properties[key].serialCurrent! += numOfInstancesUpdated;
            });
        }

        return updatedTemplateData;
    }

    private async isPropertyOfTemplateInUsedInRules(templateId: string, properties: string[]) {
        const allRules = await this.relationshipTemplateService.searchRules({});
        return allRules.forEach((rule) => checkPropertyInUsedFromFormula(rule.formula, templateId, properties));
    }

    private async isPropertyOfTemplateInUsedInGantts(entityTemplateId: string, properties: string[]) {
        const [sourceRelationShipTemplatesIDs, destinationRelationShipTemplatesIDs] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
        ]);

        const allRelationShips = [...sourceRelationShipTemplatesIDs, ...destinationRelationShipTemplatesIDs];
        const relationshipTemplateIds = allRelationShips.map((relationShip) => relationShip._id);

        const [relevantGanttsWithEntityTemplate, ganttsWithConnectedRelationship] = await Promise.all([
            this.ganttService.searchGantts({ entityTemplateId, limit: 0, step: 0 }),
            this.ganttService.searchGantts({ relationshipTemplateIds, limit: 0, step: 0 }),
        ]);

        const allRelevantGanttsWithoutDuplicate = Array.from(
            new Map([...relevantGanttsWithEntityTemplate, ...ganttsWithConnectedRelationship].map((item) => [item._id, item])).values(),
        );

        allRelevantGanttsWithoutDuplicate.forEach(({ items }) => {
            items.forEach(({ entityTemplate: { endDateField, fieldsToShow, id, startDateField }, connectedEntityTemplates }) => {
                properties.forEach((property) => {
                    const isFieldUsed =
                        (id === entityTemplateId && fieldsToShow.includes(property)) ||
                        startDateField === property ||
                        endDateField === property ||
                        connectedEntityTemplates.some(({ relationshipTemplateId, fieldsToShow: connectedFields }) => {
                            const currentRelationShip = allRelationShips.find(({ _id }) => _id === relationshipTemplateId);

                            return (
                                (currentRelationShip?.destinationEntityId === entityTemplateId ||
                                    currentRelationShip?.sourceEntityId === entityTemplateId) &&
                                connectedFields.includes(property)
                            );
                        });

                    if (isFieldUsed)
                        throw new BadRequestError('can not delete field that used in gantts', {
                            errorCode: config.errorCodes.failedToDeleteField,
                            type: 'gantts',
                            property,
                        });
                });
            });
        });
    }

    private async checkIfPropertyInUsedBeforeDeleteOrArchive(templateId: string, properties: string[]) {
        if (properties.length)
            await Promise.all([
                this.isPropertyOfTemplateInUsedInGantts(templateId, properties),
                this.isPropertyOfTemplateInUsedInRules(templateId, properties),
                this.isPropertyInUsedAsRelatedFieldInRelationshipReference(templateId, properties),
            ]);
    }

    private async deleteFilesOfDeletedProperty(templateId: string, removedFilesProperties: Record<string, boolean>, numOfInstances: number) {
        const promises: Promise<void | AxiosResponse>[] = [];
        const { searchEntitiesChunkSize } = config.service;

        for (let fileIndex = 0; numOfInstances - fileIndex > 0; fileIndex += searchEntitiesChunkSize) {
            promises.push(
                (async () => {
                    const filePaths: string[] = [];
                    const { entities } = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, {
                        limit: searchEntitiesChunkSize,
                        skip: fileIndex,
                    });

                    entities.forEach(({ entity }) => {
                        Object.entries(removedFilesProperties).forEach(([filePropertyName, isMultipleFiles]) => {
                            const fileToRemove = entity.properties[filePropertyName];

                            if (fileToRemove) {
                                if (isMultipleFiles) filePaths.push(...fileToRemove);
                                else filePaths.push(fileToRemove);
                            }
                        });
                    });

                    this.storageService.deleteFiles(filePaths).catch((error) => {
                        logger.error('Failed to delete files', filePaths, error);
                    });
                })(),
            );
        }

        await Promise.all(promises);
    }

    private async isPropertyInUsedAsRelatedFieldInRelationshipReference(templateId: string, properties: string[]) {
        const allEntityTemplates = await this.entityTemplateService.searchEntityTemplates();

        allEntityTemplates.forEach((entityTemplate) => {
            Object.values(entityTemplate.properties.properties).forEach(({ format, relationshipReference }) => {
                if (
                    format === 'relationshipReference' &&
                    relationshipReference?.relatedTemplateId === templateId &&
                    properties.includes(relationshipReference?.relatedTemplateField)
                ) {
                    throw new BadRequestError('that field is used as relationship reference field', {
                        errorCode: config.errorCodes.failedToDeleteField,
                        type: 'relationshipReference',
                        property: relationshipReference?.relatedTemplateField,
                        relatedTemplateName: entityTemplate.name,
                    });
                }
            });
        });
    }

    private async deletePropertyOfEntityTemplate(
        id: string,
        count: number,
        removedProperties: string[],
        currentTemplate: IMongoEntityTemplatePopulated,
    ) {
        if (!removedProperties.length) return;

        const removedFilesProperties = removedProperties.reduce(
            (acc, propertyToRemove) => {
                const { format, items } = currentTemplate.properties.properties[propertyToRemove];

                if (format === 'fileId' || items?.format === 'fileId') {
                    acc[propertyToRemove] = items?.format === 'fileId';
                }

                return acc;
            },
            {} as Record<string, boolean>,
        );

        if (Object.keys(removedFilesProperties).length) {
            await this.deleteFilesOfDeletedProperty(id, removedFilesProperties, count);
        }

        const { err } = await trycatch(() =>
            this.instancesService.deletePropertiesOfTemplate(id, removedProperties, currentTemplate.properties.properties),
        );

        if (err) {
            const manipulatedTemplate = JSON.parse(JSON.stringify(currentTemplate));

            Object.entries(currentTemplate.properties.properties).forEach(([name, value]) => {
                if (value.format === 'relationshipReference' && value.relationshipReference) {
                    const { relationshipTemplateId, ...restData } = value.relationshipReference;
                    manipulatedTemplate.properties.properties[name].relationshipReference = restData;
                }
            });

            const updatedTemplate: Omit<IEntityTemplate, 'disabled'> = {
                ...this.removeBasicFields(manipulatedTemplate),
                category: currentTemplate.category._id,
            };

            await this.entityTemplateService.updateEntityTemplate(id, updatedTemplate);
            throw err;
        }
    }

    private async handleFiles(
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        currTemplate: IMongoEntityTemplatePopulated,
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
    ) {
        let iconFileId: string | null;

        if (file) {
            if (currTemplate.iconFileId) await this.storageService.deleteFile(currTemplate.iconFileId);
            iconFileId = await this.storageService.uploadFile(file[0]);
        } else if (currTemplate.iconFileId && !updatedTemplateData.iconFileId) {
            await this.storageService.deleteFile(currTemplate.iconFileId);
            iconFileId = null;
        } else iconFileId = currTemplate.iconFileId;

        const { documentTemplatesIdsToKeep = [], documentTemplatesIdsToDelete = [] } = _.groupBy(
            currTemplate.documentTemplatesIds,
            (documentTemplateId) => {
                return updatedTemplateData.documentTemplatesIds?.includes(documentTemplateId)
                    ? 'documentTemplatesIdsToKeep'
                    : 'documentTemplatesIdsToDelete';
            },
        );

        if (documentTemplatesIdsToDelete.length) await this.storageService.deleteFiles(documentTemplatesIdsToDelete);

        return {
            iconFileId,
            documentTemplatesIds: [...documentTemplatesIdsToKeep, ...(files ? await this.storageService.uploadFiles(files) : [])],
        };
    }

    async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await this.entityTemplateService.getCategoryById(updatedTemplateData.category);

        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        const currTemplate = await this.entityTemplateService.getEntityTemplateById(id);

        const populatedTemplates = await this.getAndPopulateAllTemplatesConstraints([currTemplate]);
        const [populatedCurrTemplate] = populatedTemplates;

        if (currTemplate.disabled === true) throw new BadRequestError('can not update disabled template');

        if (!this.checkValidAmountOfArchiveProperties(updatedTemplateData.properties.properties))
            throw new BadRequestError('can not archive all properties');

        const removeRequiredProperties = populatedCurrTemplate.properties.required.filter(
            (property) => !updatedTemplateData.properties.required.includes(property),
        );

        if (removeRequiredProperties.length > 0)
            this.isPropertyInUsedAsRelatedFieldInRelationshipReference(currTemplate._id, removeRequiredProperties);

        const removedProperties: string[] = [];
        const archiveProperties: string[] = [];

        if (count > 0) {
            if (updatedTemplateData.name !== currTemplate.name) throw new BadRequestError('can not change template name');

            Object.entries(currTemplate.properties.properties).forEach(([key, value]) => {
                const newValue = updatedTemplateData.properties.properties[key];

                if ((!newValue || newValue?.isNewPropNameEqualDeletedPropName) && !currTemplate.actions) removedProperties.push(key);
                else {
                    if (value.serialCurrent !== undefined) updatedTemplateData.properties.properties[key].serialCurrent = value.serialCurrent;
                    if (value.type !== newValue.type) throw new BadRequestError('can not change property type');
                    if (!value.archive && newValue.archive && !currTemplate.actions) archiveProperties.push(key);
                    if (
                        !(
                            (value.format === 'text-area' && !newValue.format && newValue.type === 'string') ||
                            (!value.format && value.type === 'string' && newValue.format === 'text-area') ||
                            value.format === newValue.format
                        )
                    )
                        throw new BadRequestError('can not change property format');
                    if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                        throw new BadRequestError('can not remove options from enum');
                    if (value.serialStarter !== newValue.serialStarter) throw new BadRequestError('can not change property serial starter');
                    if (value.relationshipReference && !_isEqual(value.relationshipReference, newValue.relationshipReference))
                        throw new BadRequestError('can not change relationship reference fields');
                }
            });
        }

        await this.checkIfPropertyInUsedBeforeDeleteOrArchive(id, removedProperties);
        await this.checkIfPropertyInUsedBeforeDeleteOrArchive(id, archiveProperties);

        const { iconFileId, documentTemplatesIds } = await this.handleFiles(updatedTemplateData, currTemplate, { file, files });

        const { uniqueConstraints, properties, ...restOfTemplateData } = await this.updateNewSerialNumberFields(
            id,
            updatedTemplateData,
            currTemplate,
        ).catch((error) => {
            throw new BadRequestError(`Failed to create serial number fields for existing entities: ${error}`);
        });

        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        Object.keys(restOfTemplatePropertiesObject.properties).forEach(
            (key) => delete restOfTemplatePropertiesObject.properties[key].isNewPropNameEqualDeletedPropName,
        );

        const updatedTemplate = await this.entityTemplateService.updateEntityTemplate(id, {
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
            documentTemplatesIds,
        });

        await this.deletePropertyOfEntityTemplate(id, count, removedProperties, currTemplate);

        await this.instancesService.updateConstraintsOfTemplate(id, {
            uniqueConstraints,
            requiredConstraints,
        });

        return this.populateTemplateConstraints(updatedTemplate, requiredConstraints, uniqueConstraints);
    }

    private checkValidAmountOfArchiveProperties(updatedTemplateProperties: Record<string, IEntitySingleProperty>) {
        const archivePropertiesNumber = Object.values(updatedTemplateProperties).reduce((count, { archive }) => (archive ? count + 1 : count), 0);

        return archivePropertiesNumber < Object.values(updatedTemplateProperties).length;
    }

    async updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        const updatedEntityTemplate = await this.entityTemplateService.updateEntityTemplateStatus(id, disabledStatus);

        const allConstraints = await this.instancesService.getAllConstraints();
        const constraintsOfTemplate = allConstraints.find(({ templateId }) => templateId === updatedEntityTemplate._id);

        return this.populateTemplateConstraints(
            updatedEntityTemplate,
            constraintsOfTemplate?.requiredConstraints ?? [],
            constraintsOfTemplate?.uniqueConstraints ?? [],
        );
    }

    removeBasicFields(template: IMongoEntityTemplatePopulated) {
        const { createdAt, updatedAt, _id, disabled, ...rest } = template;
        return rest;
    }

    async prepareUpdateOrDeleteEnumFieldValue(
        id: string,
        values: IUpdateOrDeleteEnumFieldReqData,
        fieldValue: string,
        template: IMongoEntityTemplatePopulated,
        update: boolean,
        field: string,
    ) {
        if (!values.options) {
            throw new NotFoundError('No options array');
        }
        const valueIndex = values.options.indexOf(fieldValue);
        if (valueIndex === -1) {
            throw new NotFoundError('Field value not found in options array');
        }
        const curentTemplateEnum = template.properties.properties[values.name].enum || values.options;
        let templateEnumFieldValues = [...curentTemplateEnum];
        if (update) templateEnumFieldValues[valueIndex] = field;
        // eslint-disable-next-line @typescript-eslint/no-shadow
        else templateEnumFieldValues = templateEnumFieldValues.filter((_, index) => valueIndex !== index);
        const templateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled'> = this.removeBasicFields(template);
        if (template.enumPropertiesColors?.[values.name]?.[fieldValue] !== undefined) {
            let newFieldName: Record<string, string>;
            if (update)
                newFieldName = {
                    ...template.enumPropertiesColors[values.name],
                    [field]: template.enumPropertiesColors[values.name][fieldValue],
                };
            else newFieldName = template.enumPropertiesColors[values.name];
            delete newFieldName[fieldValue];
            templateWithoutProperties.enumPropertiesColors = {
                ...templateWithoutProperties.enumPropertiesColors,
                [values.name]: { ...newFieldName },
            };
        }

        if (!templateWithoutProperties.properties.properties[values.name].items)
            templateWithoutProperties.properties.properties[values.name].enum = templateEnumFieldValues;
        const { items } = templateWithoutProperties.properties.properties[values.name];
        if (items && items.enum) {
            items.enum = templateEnumFieldValues;
        }
        try {
            const updatedEntityTemplate = await this.entityTemplateService.updateEntityTemplate(id, {
                ...templateWithoutProperties,
                category: templateWithoutProperties.category._id,
            } as Omit<IEntityTemplate, 'disabled'>);
            logger.info('Initial mongoDB update worked');

            return updatedEntityTemplate;
        } catch (error) {
            throw new ServiceError(internalServerErrorStatus, 'Initial mongoDB update failed', { error });
        }
    }

    async neoRollBack(
        id: string,
        values: IUpdateOrDeleteEnumFieldReqData,
        index: number,
        templateWithoutProperties: IEntityTemplatePopulated,
        fieldValue: string,
        template: IMongoEntityTemplatePopulated,
        _field: string,
    ) {
        const templateEnumFieldValuesRB = [...values.options];
        templateEnumFieldValuesRB[index] = fieldValue;
        if (!templateWithoutProperties.properties.properties[values.name].items)
            // eslint-disable-next-line no-param-reassign
            template.properties.properties[values.name].enum = templateEnumFieldValuesRB;
        const rollBackTemplateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled'> = this.removeBasicFields(template);
        try {
            const rolledBackEntityTemplate = await this.entityTemplateService.updateEntityTemplate(id, {
                ...rollBackTemplateWithoutProperties,
                category: templateWithoutProperties.category._id,
            } as Omit<IEntityTemplate, 'disabled'>);
            logger.info('RollBack mongoDB succeeded', { rollBackTemplateWithoutProperties });

            return rolledBackEntityTemplate;
        } catch (error) {
            throw new ServiceError(internalServerErrorStatus, 'RollBack mongoDB update failed', { error });
        }
    }

    async handleConversionRollback(
        entityTemplateId: string,
        currentRelationshipTemplate: IMongoRelationshipTemplate,
        rollBackTemplateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled'>,
    ) {
        try {
            const { createdAt, updatedAt, _id, ...restRelationshipTemplate } = currentRelationshipTemplate;
            await this.relationshipTemplateService.updateRelationshipTemplate(_id, restRelationshipTemplate);

            await this.entityTemplateService.updateEntityTemplate(
                entityTemplateId,
                {
                    ...rollBackTemplateWithoutProperties,
                    category: rollBackTemplateWithoutProperties.category._id,
                },
                false,
            );

            logger.info('RollBack mongoDB succeeded', { rollBackTemplateWithoutProperties, restRelationshipTemplate });
        } catch (error) {
            throw new ServiceError(internalServerErrorStatus, 'RollBack mongoDB update failed', { error });
        }
    }

    async updateEntityEnumFieldValue(
        id: string,
        field: string,
        values: IUpdateOrDeleteEnumFieldReqData,
        fieldValue: string,
    ): Promise<IMongoEntityTemplatePopulated> {
        const template = await this.entityTemplateService.getEntityTemplateById(id);
        const templateWithoutProperties = await this.prepareUpdateOrDeleteEnumFieldValue(id, values, fieldValue, template, true, field);
        const index = values.options.indexOf(fieldValue);
        try {
            await this.instancesService.updateEnumFieldOfEntity(id, field, fieldValue, { name: values.name, type: values.type });
        } catch (neoError: any) {
            if (neoError.response?.status === notFoundStatus) {
                throw new NotFoundError('Neo4j update failed: Node not found', { error: neoError });
            }

            logger.error('Neo4j update failed: starting roll-back', { error: neoError });
            await this.neoRollBack(id, values, index, templateWithoutProperties, fieldValue, template, field);

            throw new ServiceError(internalServerErrorStatus, 'Neo4j update failed: starting roll-back', { error: neoError });
        }

        const { requiredConstraints, uniqueConstraints } = await this.instancesService.getConstraintsOfTemplate(id);
        return this.populateTemplateConstraints(templateWithoutProperties, requiredConstraints, uniqueConstraints);
    }

    private async checkFieldValueUsage(id: string, fieldValue: string, fieldName: string, fieldType: string): Promise<void> {
        const data = await this.instancesService.getIfValuefieldIsUsed(id, fieldValue, fieldName, fieldType);
        const cantDeleteFieldValue = Boolean(data);
        if (cantDeleteFieldValue) throw new BadRequestError('cant remove used values');
    }

    async deleteEntityEnumFieldValue(id: string, values: IUpdateOrDeleteEnumFieldReqData, fieldValue: string) {
        await this.checkFieldValueUsage(id, fieldValue, values.name, values.type);
        const template = await this.entityTemplateService.getEntityTemplateById(id);
        const updatedEntityTemplate = await this.prepareUpdateOrDeleteEnumFieldValue(id, values, fieldValue, template, false, '');
        const { requiredConstraints, uniqueConstraints } = await this.instancesService.getConstraintsOfTemplate(id);
        return this.populateTemplateConstraints(updatedEntityTemplate, requiredConstraints, uniqueConstraints);
    }

    // relationship templates
    private async throwIfEntityTemplateDoesntExist(entityTemplateId: string, errorMessage: string) {
        const { err: getEntityErr } = await trycatch(() => this.entityTemplateService.getEntityTemplateById(entityTemplateId));
        if (getEntityErr) {
            const { response } = getEntityErr as AxiosError;

            if (response?.status === notFoundStatus) throw new BadRequestError(errorMessage);

            throw getEntityErr;
        }
    }

    async createRelationshipTemplate(relationshipTemplate: IRelationshipTemplate) {
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        await this.throwIfEntityTemplateDoesntExist(sourceEntityId, 'source entity of relation doesnt exist');
        await this.throwIfEntityTemplateDoesntExist(destinationEntityId, 'destination entity of relation doesnt exist');

        const { disabled: sourceEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(sourceEntityId);
        const { disabled: destinationEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true)
            throw new BadRequestError('can not create relationship template with disabled entity');

        return this.relationshipTemplateService.createRelationshipTemplate(relationshipTemplate);
    }

    async updateRelationshipTemplate(templateId: string, updatedFields: Partial<IRelationshipTemplate>) {
        if (updatedFields.sourceEntityId) {
            await this.throwIfEntityTemplateDoesntExist(updatedFields.sourceEntityId, 'source entity of relation doesnt exist');
        }

        if (updatedFields.destinationEntityId) {
            await this.throwIfEntityTemplateDoesntExist(updatedFields.destinationEntityId, 'destination entity of relation doesnt exist');
        }

        const relationshipCount = await this.instancesService.getRelationshipsCountByTemplateId(templateId);
        const currTemplate = await this.relationshipTemplateService.getRelationshipTemplateById(templateId);

        const { disabled: sourceEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(currTemplate.sourceEntityId);
        const { disabled: destinationEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(currTemplate.destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true)
            throw new BadRequestError('can not update relationship template with disabled entity');

        if (relationshipCount > 0) {
            if (updatedFields.name !== currTemplate.name) throw new BadRequestError('can not change template name');
            if (updatedFields.sourceEntityId !== currTemplate.sourceEntityId) throw new BadRequestError('can not change source entity template');
            if (updatedFields.destinationEntityId !== currTemplate.destinationEntityId)
                throw new BadRequestError('can not change destination entity template');
        }

        return this.relationshipTemplateService.updateRelationshipTemplate(templateId, updatedFields);
    }

    getDependentRelationshipTemplates(formula: IFormula) {
        const parameters = getParametersOfFormula(formula);
        const variablesWithAggregation = parameters.filter(({ variable }) => variable.aggregatedRelationship);
        const relationshipTemplates = variablesWithAggregation.map(({ variable }) => variable.aggregatedRelationship!.relationshipTemplateId);

        return [...new Set(relationshipTemplates)];
    }

    async deleteRelationshipTemplate(templateId: string) {
        const relationshipCount = await this.instancesService.getRelationshipsCountByTemplateId(templateId);
        if (relationshipCount !== 0) {
            throw new BadRequestError('relationship template still has instances', {
                errorCode: relationshipTemplateHasInstances,
            });
        }

        const relationshipTemplate = await this.relationshipTemplateService.getRelationshipTemplateById(templateId);
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const sourceRelatedRules = await this.relationshipTemplateService.searchRules({ entityTemplateIds: [sourceEntityId] });
        const destinationRelatedRules = await this.relationshipTemplateService.searchRules({ entityTemplateIds: [destinationEntityId] });

        const dependentRelationshipsToSource = sourceRelatedRules.map(({ formula }) => {
            return this.getDependentRelationshipTemplates(formula);
        });
        const dependentRelationshipsToDestination = destinationRelatedRules.map(({ formula }) => {
            return this.getDependentRelationshipTemplates(formula);
        });

        const dependentRelationships = [...new Set(...dependentRelationshipsToSource, ...dependentRelationshipsToDestination)];

        if (dependentRelationships.includes(templateId)) {
            throw new BadRequestError('relationship template still has rules', { errorCode: relationshipTemplateHasRules });
        }

        return this.relationshipTemplateService.deleteRelationshipTemplate(templateId);
    }

    async validateConvertRelationshipToRelationshipField(
        requiredConstraints: IConstraintsOfTemplate['requiredConstraints'],
        existingRelationships: IRelationship[],
        templateId: string,
        addFieldToSrcEntity: boolean,
    ) {
        validateRequiredConstraints(requiredConstraints);
        validateUniqueRelationships(existingRelationships, addFieldToSrcEntity);
        const rules: IMongoRule[] = await this.instancesService.getDependantRules(await this.relationshipTemplateService.searchRules({}), templateId);
        validateNoDependentRules(rules);
    }

    async convertRelationshipToRelationshipField(
        relationshipTemplateId: string,
        { fieldName, displayFieldName, relationshipReference },
        userId: string,
    ) {
        const currentRelationshipTemplate: IMongoRelationshipTemplate =
            await this.relationshipTemplateService.getRelationshipTemplateById(relationshipTemplateId);
        const { sourceEntityId, destinationEntityId } = currentRelationshipTemplate;

        const addFieldToSrcEntity = relationshipReference.relatedTemplateId === destinationEntityId;
        const entityIdToUpdate = addFieldToSrcEntity ? sourceEntityId : destinationEntityId;

        const [existingRelationships, { requiredConstraints: destRequiredConstraints }] = await Promise.all([
            this.instancesService.getRelationshipsByEntitiesAndTemplate({
                sourceEntityId,
                destinationEntityId,
                templateId: relationshipTemplateId,
            }),
            this.instancesService.getConstraintsOfTemplate(relationshipReference.relatedTemplateId),
        ]);

        await this.validateConvertRelationshipToRelationshipField(
            destRequiredConstraints,
            existingRelationships,
            relationshipTemplateId,
            addFieldToSrcEntity,
        );

        const newRelationshipField = buildNewRelationshipField(
            displayFieldName,
            relationshipTemplateId,
            relationshipReference.relationshipTemplateDirection,
            relationshipReference.relatedTemplateId,
            relationshipReference.relatedTemplateField,
        );

        const restOfEntityTemplate: Omit<IEntityTemplatePopulated, 'disabled'> = this.removeBasicFields(
            await this.entityTemplateService.getEntityTemplateById(entityIdToUpdate),
        );
        const entityTemplateToUpdate: Omit<IEntityTemplate, 'disabled'> = {
            ...restOfEntityTemplate,
            category: restOfEntityTemplate.category._id,
            properties: {
                ...restOfEntityTemplate.properties,
                properties: {
                    ...restOfEntityTemplate.properties.properties,
                    [fieldName]: newRelationshipField,
                },
            },
            propertiesOrder: [...restOfEntityTemplate.propertiesOrder, fieldName],
        };

        const { updatedRelationShipTemplate, updatedEntityTemplate } = await this.entityTemplateService.convertToRelationshipField(
            entityIdToUpdate,
            relationshipTemplateId,
            entityTemplateToUpdate,
        );

        try {
            if (existingRelationships.length > 0)
                await this.instancesService.convertToRelationshipField(existingRelationships, addFieldToSrcEntity, fieldName, userId);
        } catch (error) {
            logger.error('Neo4j update failed: starting roll-back', { error });
            await this.handleConversionRollback(entityIdToUpdate, currentRelationshipTemplate, restOfEntityTemplate);
            throw new ServiceError(internalServerErrorStatus, 'Neo4j update failed: starting roll-back', { error });
        }
        return { updatedRelationShipTemplate, updatedEntityTemplate };
    }

    // entities
    async getAllowedEntitiesTemplates(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        searchBody?: ISearchEntityTemplatesBody,
    ) {
        const updatedSearchBody: ISearchEntityTemplatesBody = { ...searchBody };

        if (!userPermissions.admin && !userPermissions.templates && userPermissions.instances) {
            updatedSearchBody.categoryIds = Object.keys(userPermissions.instances.categories);
        }

        return this.entityTemplateService.searchEntityTemplates(updatedSearchBody);
    }

    // rules
    async updateRuleStatusById(ruleId: string, disabled: boolean) {
        // todo: if disabling, check no open requests, search in rule-breaches
        // if (!disabled) {

        // }

        return this.relationshipTemplateService.updateRuleStatusById(ruleId, disabled);
    }

    async deleteRuleById(ruleId: string) {
        const alerts = await this.ruleBreachService.getRuleBreachAlertsByRuleId(ruleId);
        const requests = await this.ruleBreachService.getRuleBreachRequestsByRuleId(ruleId);
        if (alerts.length !== 0 || requests.length !== 0) {
            throw new BadRequestError('rules has alerts/requests', { errorCode: ruleHasAlertsOrRequests });
        }
        return this.relationshipTemplateService.deleteRuleById(ruleId);
    }
}

export default TemplatesManager;
