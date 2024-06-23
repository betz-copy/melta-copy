import { AxiosError, AxiosResponse } from 'axios';
import lodashUniqby from 'lodash.uniqby';
import _isEqual from 'lodash.isequal';
import {
    EntityTemplateManagerService,
    ICategory,
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplatesBody,
} from '../../externalServices/entityTemplateService';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateService';
import { deleteFile, deleteFiles, uploadFile } from '../../externalServices/storageService';
import { trycatch } from '../../utils';
import { removeTmpFile } from '../../utils/fs';
import { ServiceError } from '../error';
import PermissionsManager from '../permissions/manager';
import config from '../../config';
import { IRule } from './rules/interfaces';
import { getParametersOfFormula } from './rules';
import { IFormula } from './rules/interfaces/formula';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import {
    IEntityTemplateWithConstraints,
    IMongoEntityTemplateWithConstraints,
    IMongoEntityTemplateWithConstraintsPopulated,
    IUpdateOrDeleteEnumFieldReqData,
} from './interfaces';
import { ProcessManagerService } from '../../externalServices/processService';
import ProcessTemplatesManager from '../processes/processTemplates/manager';
import { isProcessManager } from '../../externalServices/permissionsService';
import { IPermissionsOfUser } from '../permissions/interfaces';
import { GanttsService, IMongoGantt } from '../../externalServices/ganttsService';
import { checkPropertyInUsedFromFormula } from './rules/checkIfPropertyInUsed';
import logger from '../../utils/logger/logsLogger';
import { IUniqueConstraintOfTemplate } from '../../externalServices/instanceService/interfaces/entities';

const {
    categoryHasTemplates,
    entityTemplateHasOutgoingRelationships,
    entityTemplateHasIncomingRelationships,
    entityTemplateHasInstances,
    relationshipTemplateHasInstances,
    relationshipTemplateHasRules,
    ruleHasAlertsOrRequests,
} = config.errorCodes;

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

    private static async getAllowedRules(
        allowedRelationshipsTemplates: IRelationshipTemplate[],
        allowedEntityTemplatesIdsByOneRelationship: string[],
    ) {
        const allowedRelationshipsTemplatesIds = allowedRelationshipsTemplates.map(({ _id }) => _id);

        const rulesByAllowedRelationshipTemplates = await RelationshipsTemplateManagerService.searchRules({
            relationshipTemplateIds: allowedRelationshipsTemplatesIds,
        });

        /*
         * you need rules of pinned entity templates of "by one relationship"
         * because you can break the rule if it has aggregation on the pinned entity (pinned.conncections.allowedEntityToEdit)
         * for example, say you have permissions only for people.
         * so you receive templates
         * 1. template of person - because you have direct permission
         * 2. template of flight - because there's relationship person<=>flight
         * 3!!!. template of trip - because there's a rule of flight<=>trip,
         *    and flight is the pinned entity in the rule, and the rule might contain aggregation of "flight.flightsOn.person",
         *    and rule might break on person change
         */
        const rulesPinnedByEntityTemplatesByOneRelationship = await RelationshipsTemplateManagerService.searchRules({
            pinnedEntityTemplateIds: allowedEntityTemplatesIdsByOneRelationship,
        });

        const allowedRules: IRule[] = lodashUniqby([...rulesByAllowedRelationshipTemplates, ...rulesPinnedByEntityTemplatesByOneRelationship], '_id');

        const allowedRelationshipTemplatesIdsBecauseOfRules = allowedRules
            .map(({ relationshipTemplateId }) => relationshipTemplateId)
            .filter((relationshipTemplateId) => !allowedRelationshipsTemplatesIds.includes(relationshipTemplateId));

        const allowedRelationshipTemplatesBecauseOfRules = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            ids: allowedRelationshipTemplatesIdsBecauseOfRules,
        });

        const unpinnedEntityTemplatesIdsOfAllowedRules = allowedRelationshipTemplatesBecauseOfRules.map((relationshipTemplate) => {
            const rule = allowedRules.find(({ relationshipTemplateId }) => relationshipTemplateId === relationshipTemplate._id)!;
            const unpinnedEntityTemplateId =
                relationshipTemplate.sourceEntityId === rule.pinnedEntityTemplateId
                    ? relationshipTemplate.destinationEntityId
                    : relationshipTemplate.sourceEntityId;
            return unpinnedEntityTemplateId;
        });

        const unknownUnpinnedEntityTemplatesIdsOfAllowedRules = unpinnedEntityTemplatesIdsOfAllowedRules.filter((entityTemplateId) => {
            return !allowedEntityTemplatesIdsByOneRelationship.includes(entityTemplateId);
        });

        const allowedEntityTemplatesBecauseOfRules = await EntityTemplateManagerService.searchEntityTemplates({
            ids: unknownUnpinnedEntityTemplatesIdsOfAllowedRules,
        });

        return {
            allowedRules,
            allowedRelationshipTemplatesBecauseOfRules,
            allowedEntityTemplatesBecauseOfRules,
        };
    }

    // all
    static async getAllAllowedTemplates(userId: string, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allCategories = await TemplatesManager.getAllCategories();

        const allowedEntityTemplates = await TemplatesManager.getAllowedEntitiesTemplates(permissionsOfUserId);
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

        const allowedEntityTemplatesIdsByOneRelationship = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            allowedRelationshipsTemplatesBySource,
            allowedRelationshipsTemplatesByDestination,
            allowedEntityTemplatesIds,
        );

        const allowedEntityTemplatesByOneRelationship = await EntityTemplateManagerService.searchEntityTemplates({
            ids: allowedEntityTemplatesIdsByOneRelationship,
        });

        const { allowedRules, allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesBecauseOfRules } =
            await TemplatesManager.getAllowedRules(allowedRelationshipsTemplates, allowedEntityTemplatesIdsByOneRelationship);

        const allAllowedEntityTemplates = [
            ...allowedEntityTemplates,
            ...allowedEntityTemplatesByOneRelationship,
            ...allowedEntityTemplatesBecauseOfRules,
        ];

        const allAllowedEntityTemplatesWithConstraints = await TemplatesManager.getAndPopulateAllTemplatesConstraints(allAllowedEntityTemplates);
        const processTemplatesBeforePopulate = await ProcessManagerService.searchProcessTemplates(
            (await isProcessManager(userId)) ? {} : { reviewerId: userId },
        );
        const processTemplates = await Promise.all(
            processTemplatesBeforePopulate.map((processTemplate) => ProcessTemplatesManager.getTemplateWithPopulatedStepReviewers(processTemplate)),
        );

        return {
            categories: allCategories,
            entityTemplates: allAllowedEntityTemplatesWithConstraints,
            relationshipTemplates: [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules],
            rules: allowedRules,
            processTemplates,
        };
    }

    static async getAllAllowedEntityTemplates(permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedEntityTemplates = await TemplatesManager.getAllowedEntitiesTemplates(permissionsOfUserId);
        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const allowedRelationshipsTemplatesBySource = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            sourceEntityIds: allowedEntityTemplatesIds,
        });
        const allowedRelationshipsTemplatesByDestination = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            destinationEntityIds: allowedEntityTemplatesIds,
        });

        const allowedEntityTemplatesIdsByOneRelationship = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            allowedRelationshipsTemplatesBySource,
            allowedRelationshipsTemplatesByDestination,
            allowedEntityTemplatesIds,
        );

        const allowedEntityTemplatesByOneRelationship = await EntityTemplateManagerService.searchEntityTemplates({
            ids: allowedEntityTemplatesIdsByOneRelationship,
        });

        return [...allowedEntityTemplates, ...allowedEntityTemplatesByOneRelationship];
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
            throw new ServiceError(400, 'category still has entity templates', { errorCode: categoryHasTemplates });
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
    private static populateTemplateConstraints(
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

    private static async getAndPopulateAllTemplatesConstraints(entityTemplates: IMongoEntityTemplatePopulated[]) {
        const allConstraints = await InstanceManagerService.getAllConstraints();

        const entityTemplatesWithConstraints: IMongoEntityTemplateWithConstraintsPopulated[] = entityTemplates.map((entityTemplate) => {
            const constraintsOfTemplate = allConstraints.find(({ templateId }) => templateId === entityTemplate._id);
            return TemplatesManager.populateTemplateConstraints(
                entityTemplate,
                constraintsOfTemplate?.requiredConstraints ?? [],
                constraintsOfTemplate?.uniqueConstraints ?? [],
            );
        });

        return entityTemplatesWithConstraints;
    }

    static async createEntityTemplate(
        templateData: Omit<IEntityTemplateWithConstraints, 'iconFileId'>,
        file?: Express.Multer.File,
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await EntityTemplateManagerService.getCategoryById(templateData.category);
        let iconFileId: string | null;
        if (file) {
            iconFileId = await uploadFile(file);
            await removeTmpFile(file.path);
        } else {
            iconFileId = null;
        }

        const { uniqueConstraints, properties, ...restOfTemplateData } = templateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        const entityTemplate = await EntityTemplateManagerService.createEntityTemplate({
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
        });

        await InstanceManagerService.updateConstraintsOfTemplate(entityTemplate._id, { requiredConstraints, uniqueConstraints });

        return TemplatesManager.populateTemplateConstraints(entityTemplate, requiredConstraints, uniqueConstraints);
    }

    static async throwIfEntityHasRelationships(id: string) {
        const outgoingRelationships = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: [id] });
        if (outgoingRelationships.length > 0) {
            throw new ServiceError(400, 'entity template still has outgoing relationships', {
                errorCode: entityTemplateHasOutgoingRelationships,
            });
        }
        const incomingRelationships = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [id] });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(400, 'entity template still has incoming relationships', {
                errorCode: entityTemplateHasIncomingRelationships,
            });
        }
    }

    static async throwIfEntityTemplateHasInstances(id: string) {
        const { count } = await InstanceManagerService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        if (count > 0) {
            throw new ServiceError(400, 'entity template still has instances', { errorCode: entityTemplateHasInstances });
        }
    }

    static async deleteEntityTemplate(id: string): Promise<IMongoEntityTemplateWithConstraints> {
        await TemplatesManager.throwIfEntityHasRelationships(id);
        await TemplatesManager.throwIfEntityTemplateHasInstances(id);

        const { iconFileId } = await EntityTemplateManagerService.getEntityTemplateById(id);
        if (iconFileId) {
            await deleteFile(iconFileId);
        }

        await InstanceManagerService.updateConstraintsOfTemplate(id, { requiredConstraints: [], uniqueConstraints: [] });

        const entityTemplate = await EntityTemplateManagerService.deleteEntityTemplate(id);

        return {
            ...entityTemplate,
            properties: {
                ...entityTemplate.properties,
                required: [],
            },
            uniqueConstraints: [],
        };
    }

    static async updateNewSerialNumberFields(
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

            const numOfInstancesUpdated: number = await InstanceManagerService.enumerateNewSerialNumberFields(id, newSerialNumberValues);

            newSerialNumberFields.forEach((key) => {
                // eslint-disable-next-line no-param-reassign
                updatedTemplateData.properties.properties[key].serialCurrent! += numOfInstancesUpdated;
            });
        }

        return updatedTemplateData;
    }

    private static async isPropertyOfTemplateInUsedInRules(templateId: string, properties: string[]) {
        const allRules = await RelationshipsTemplateManagerService.searchRules({});
        return allRules.forEach((rule) => checkPropertyInUsedFromFormula(rule.formula, templateId, properties));
    }

    private static async isPropertyOfTemplateInUsedInGantts(templateId: string, properties: string[]) {
        const sourceRelationShipTEmplatesIDs = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            sourceEntityIds: [templateId],
        });

        const destinationRelationShipTEmplatesIDs = await RelationshipsTemplateManagerService.searchRelationshipTemplates({
            destinationEntityIds: [templateId],
        });

        const allRelationShips = [...sourceRelationShipTEmplatesIDs, ...destinationRelationShipTEmplatesIDs];

        const relevantGanttsWithEntityTemplate = await GanttsService.searchGantts({
            entityTemplateId: templateId,
            limit: 0,
            step: 0,
        });

        const ganttsWithConnectedRelationship = await GanttsService.searchGantts({
            relationshipTemplateIds: allRelationShips.map((relationShip) => relationShip._id),
            limit: 0,
            step: 0,
        });

        const combinedRelevantGantts: IMongoGantt[] = relevantGanttsWithEntityTemplate.concat(ganttsWithConnectedRelationship);

        const allRelevantGanttsWithoutDuplicate = combinedRelevantGantts.reduce<IMongoGantt[]>((acc, current) => {
            if (!acc.some((item) => item._id === current._id)) {
                acc.push(current);
            }
            return acc;
        }, []);

        allRelevantGanttsWithoutDuplicate.forEach((gantt) => {
            gantt.items.forEach((item) => {
                properties.forEach((property) => {
                    const { entityTemplate, connectedEntityTemplates } = item;
                    let found = false;

                    if (
                        (entityTemplate.id === templateId && entityTemplate.fieldsToShow.includes(property)) ||
                        entityTemplate.startDateField === property ||
                        entityTemplate.endDateField === property
                    )
                        found = true;

                    if (!found)
                        found = connectedEntityTemplates.some((connectedEntityTemplate) => {
                            const currentRelationShip = allRelationShips.find(
                                (relationShip) => relationShip._id === connectedEntityTemplate.relationshipTemplateId,
                            );

                            return currentRelationShip?.destinationEntityId === templateId || currentRelationShip?.sourceEntityId === templateId;
                        });

                    if (found)
                        throw new ServiceError(400, 'can not delete field that used in gantts', {
                            errorCode: config.errorCodes.failedToDeleteField,
                            type: 'gantts',
                            property,
                        });
                });
            });
        });
    }

    private static async checkPropertyInUsed(templateId: string, properties: string[]) {
        await TemplatesManager.isPropertyOfTemplateInUsedInGantts(templateId, properties);
        await TemplatesManager.isPropertyOfTemplateInUsedInRules(templateId, properties);
    }

    private static async deleteFilesOfDeletedProperty(templateId: string, removedFilesProperties: Record<string, boolean>, numOfInstances: number) {
        const promises: Promise<void | AxiosResponse>[] = [];
        const { searchEntitiesChunkSize } = config.service;

        for (let fileIndex = 0; numOfInstances - fileIndex > 0; fileIndex += searchEntitiesChunkSize) {
            promises.push(
                (async () => {
                    const { entities } = await InstanceManagerService.searchEntitiesOfTemplateRequest(templateId, {
                        limit: searchEntitiesChunkSize,
                        skip: fileIndex,
                    });

                    const filePaths: string[] = [];

                    entities.forEach(({ entity }) => {
                        Object.entries(removedFilesProperties).forEach(([filePropertyName, isMultipleFiles]) => {
                            const fileToRemove = entity.properties[filePropertyName];
                            if (fileToRemove) {
                                if (isMultipleFiles) filePaths.push(...fileToRemove);
                                else filePaths.push(fileToRemove);
                            }
                        });
                    });

                    deleteFiles(filePaths).catch((error) => {
                        logger.error('Failed to delete files', filePaths, error);
                    });
                })(),
            );
        }

        await Promise.all(promises);
    }

    static async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        file?: Express.Multer.File,
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await EntityTemplateManagerService.getCategoryById(updatedTemplateData.category);

        const { count } = await InstanceManagerService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        const currTemplate = await EntityTemplateManagerService.getEntityTemplateById(id);

        if (currTemplate.disabled === true) throw new ServiceError(400, 'can not update disabled template');

        const removedProperties: Record<string, boolean> = {};
        const removedFilesProperties: Record<string, boolean> = {};

        if (count > 0) {
            if (updatedTemplateData.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');

            Object.entries(currTemplate.properties.properties).forEach(([key, value]) => {
                const newValue = updatedTemplateData.properties.properties[key];

                if (!newValue || ('isNewPropertyWithNameOfDeletedProperty' in newValue && newValue.isNewPropertyWithNameOfDeletedProperty)) {
                    removedProperties[key] = value.type === 'string';
                    if (value.format === 'fileId' || value.items?.format === 'fileId') removedFilesProperties[key] = value.items?.format === 'fileId';
                } else {
                    if (value.serialCurrent !== undefined) {
                        // eslint-disable-next-line no-param-reassign
                        updatedTemplateData.properties.properties[key].serialCurrent = value.serialCurrent;
                    }
                    if (value.type !== newValue.type) throw new ServiceError(400, 'can not change property type');
                    if (
                        !(
                            (value.format === 'text-area' && !newValue.format && newValue.type === 'string') ||
                            (!value.format && value.type === 'string' && newValue.format === 'text-area') ||
                            value.format === newValue.format
                        )
                    )
                        throw new ServiceError(400, 'can not change property format');
                    if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                        throw new ServiceError(400, 'can not remove options from enum');
                    if (value.serialStarter !== newValue.serialStarter) throw new ServiceError(400, 'can not change property serial starter');
                }
            });
        }

        let iconFileId: string | null;
        if (file) {
            if (currTemplate.iconFileId) {
                await deleteFile(currTemplate.iconFileId);
            }

            iconFileId = await uploadFile(file);
            await removeTmpFile(file.path);
        } else if (currTemplate.iconFileId && !updatedTemplateData.iconFileId) {
            await deleteFile(currTemplate.iconFileId);

            iconFileId = null;
        } else {
            iconFileId = currTemplate.iconFileId;
        }

        await TemplatesManager.checkPropertyInUsed(id, Object.keys(removedProperties));

        const { uniqueConstraints, properties, ...restOfTemplateData } = await this.updateNewSerialNumberFields(
            id,
            updatedTemplateData,
            currTemplate,
        ).catch((error) => {
            throw new ServiceError(400, `Failed to create serial number fields for existing entities: ${error}`);
        });

        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        Object.entries(restOfTemplatePropertiesObject.properties).forEach(([key, value]) => {
            if ('isNewPropertyWithNameOfDeletedProperty' in value) {
                const updatedProperty = { ...value };
                delete updatedProperty.isNewPropertyWithNameOfDeletedProperty;
                restOfTemplatePropertiesObject.properties[key] = updatedProperty;
            }
        });

        if (Object.keys(removedFilesProperties).length > 0) {
            await TemplatesManager.deleteFilesOfDeletedProperty(id, removedFilesProperties, count);
        }

        if (Object.keys(removedProperties).length > 0) {
            await InstanceManagerService.deletePropertiesOfTemplate(id, removedProperties).catch((error) => {
                throw new ServiceError(400, `failed to delete properties ${error}`);
            });
        }

        const updatedTemplate = await EntityTemplateManagerService.updateEntityTemplate(id, {
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
        });
        await InstanceManagerService.updateConstraintsOfTemplate(id, {
            uniqueConstraints,
            requiredConstraints,
        });
        return TemplatesManager.populateTemplateConstraints(updatedTemplate, requiredConstraints, uniqueConstraints);
    }

    static updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        return EntityTemplateManagerService.updateEntityTemplateStatus(id, disabledStatus);
    }

    static removeBasicFields(template: IMongoEntityTemplatePopulated) {
        const { createdAt, updatedAt, _id, disabled, ...rest } = template;
        return rest;
    }

    static async prepareUpdateOrDeleteEnumFieldValue(
        id: string,
        values: IUpdateOrDeleteEnumFieldReqData,
        fieldValue: string,
        template: IMongoEntityTemplatePopulated,
        update: boolean,
        field: string,
    ) {
        if (!values.options) {
            throw new ServiceError(404, 'No options array');
        }
        const valueIndex = values.options.indexOf(fieldValue);
        if (valueIndex === -1) {
            throw new ServiceError(404, 'Field value not found in options array');
        }
        const curentTemplateEnum = template.properties.properties[values.name].enum || values.options;
        let templateEnumFieldValues = [...curentTemplateEnum];
        if (update) templateEnumFieldValues[valueIndex] = field;
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
            const updatedEntityTemplate = await EntityTemplateManagerService.updateEntityTemplate(id, {
                ...templateWithoutProperties,
                category: templateWithoutProperties.category._id,
            } as Omit<IEntityTemplate, 'disabled'>);
            logger.info('Initial mongoDB update worked');
            return updatedEntityTemplate;
        } catch (error) {
            logger.error('Initial mongoDB update failed', error);
            throw error;
        }
    }

    static async neoRollBack(
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
            const rolledBackEntityTemplate = await EntityTemplateManagerService.updateEntityTemplate(id, {
                ...rollBackTemplateWithoutProperties,
                category: templateWithoutProperties.category._id,
            } as Omit<IEntityTemplate, 'disabled'>);
            logger.info('RollBack mongoDB succeeded', rollBackTemplateWithoutProperties);
            return rolledBackEntityTemplate;
        } catch (error) {
            logger.warn('RollBack mongoDB update failed', error);
            throw error;
        }
    }

    static async updateEntityEnumFieldValue(
        id: string,
        field: string,
        values: IUpdateOrDeleteEnumFieldReqData,
        fieldValue: string,
    ): Promise<IMongoEntityTemplatePopulated> {
        const template = await EntityTemplateManagerService.getEntityTemplateById(id);
        const templateWithoutProperties = await TemplatesManager.prepareUpdateOrDeleteEnumFieldValue(id, values, fieldValue, template, true, field);
        const index = values.options.indexOf(fieldValue);
        try {
            await InstanceManagerService.updateEnumFieldOfEntity(id, field, fieldValue, { name: values.name, type: values.type });
        } catch (neoError: any) {
            if (neoError.response?.status === 404) {
                logger.error('Neo4j update failed: Node not found');
                // if not found, it's not an error.
                return templateWithoutProperties;
            }
            logger.warn('Neo4j update failed: starting roll-back', neoError.message, neoError.response?.status);
            await TemplatesManager.neoRollBack(id, values, index, templateWithoutProperties, fieldValue, template, field);
            throw neoError;
        }

        const { requiredConstraints, uniqueConstraints } = await InstanceManagerService.getConstraintsOfTemplate(id);
        return TemplatesManager.populateTemplateConstraints(templateWithoutProperties, requiredConstraints, uniqueConstraints);
    }

    private static async checkFieldValueUsage(id: string, fieldValue: string, fieldName: string, fieldType: string): Promise<void> {
        const data = await InstanceManagerService.getIfValuefieldIsUsed(id, fieldValue, fieldName, fieldType);
        const cantDeleteFieldValue = Boolean(data);
        if (cantDeleteFieldValue) {
            throw new ServiceError(400, 'cant remove used values');
        }
    }

    static async deleteEntityEnumFieldValue(id: string, values: IUpdateOrDeleteEnumFieldReqData, fieldValue: string) {
        await this.checkFieldValueUsage(id, fieldValue, values.name, values.type);
        const template = await EntityTemplateManagerService.getEntityTemplateById(id);
        const updatedEntityTemplate = await TemplatesManager.prepareUpdateOrDeleteEnumFieldValue(id, values, fieldValue, template, false, '');
        const { requiredConstraints, uniqueConstraints } = await InstanceManagerService.getConstraintsOfTemplate(id);
        return TemplatesManager.populateTemplateConstraints(updatedEntityTemplate, requiredConstraints, uniqueConstraints);
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

        const { disabled: sourceEntityDisabled } = await EntityTemplateManagerService.getEntityTemplateById(sourceEntityId);
        const { disabled: destinationEntityDisabled } = await EntityTemplateManagerService.getEntityTemplateById(destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true) {
            throw new ServiceError(400, 'can not create relationship template with disabled entity');
        }

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

        const { disabled: sourceEntityDisabled } = await EntityTemplateManagerService.getEntityTemplateById(currTemplate.sourceEntityId);
        const { disabled: destinationEntityDisabled } = await EntityTemplateManagerService.getEntityTemplateById(currTemplate.destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true) {
            throw new ServiceError(400, 'can not update relationship template with disabled entity');
        }

        if (relationshipCount > 0) {
            if (updatedFields.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');
            if (updatedFields.sourceEntityId !== currTemplate.sourceEntityId) throw new ServiceError(400, 'can not change source entity template');
            if (updatedFields.destinationEntityId !== currTemplate.destinationEntityId)
                throw new ServiceError(400, 'can not change destination entity template');
        }

        return RelationshipsTemplateManagerService.updateRelationshipTemplate(templateId, updatedFields);
    }

    static getDependentRelationshipTemplates(formula: IFormula) {
        const parameters = getParametersOfFormula(formula);
        const variablesWithAggregation = parameters.filter(({ variableName }) => variableName.split('.').length === 3);
        const relationshipTemplates = variablesWithAggregation.map(({ variableName }) => variableName.split('.')[1]);

        return [...new Set(relationshipTemplates)];
    }

    static async deleteRelationshipTemplate(templateId: string) {
        const relationshipCount = await InstanceManagerService.getRelationshipsCountByTemplateId(templateId);
        if (relationshipCount !== 0) {
            throw new ServiceError(400, 'relationship template still has instances', { errorCode: relationshipTemplateHasInstances });
        }

        const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(templateId);
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const relationshipRelatedRules = await RelationshipsTemplateManagerService.searchRules({ relationshipTemplateIds: [templateId] });
        const sourceRelatedRules = await RelationshipsTemplateManagerService.searchRules({ pinnedEntityTemplateIds: [sourceEntityId] });
        const destinationRelatedRules = await RelationshipsTemplateManagerService.searchRules({ pinnedEntityTemplateIds: [destinationEntityId] });

        const dependentRelationshipsToSource = sourceRelatedRules.map(({ formula }) => {
            return TemplatesManager.getDependentRelationshipTemplates(formula);
        });
        const dependentRelationshipsToDestination = destinationRelatedRules.map(({ formula }) => {
            return TemplatesManager.getDependentRelationshipTemplates(formula);
        });

        const dependentRelationships = [...new Set(...dependentRelationshipsToSource, ...dependentRelationshipsToDestination)];

        if (relationshipRelatedRules.length !== 0 || dependentRelationships.includes(templateId)) {
            throw new ServiceError(400, 'relationship template still has rules', { errorCode: relationshipTemplateHasRules });
        }

        return RelationshipsTemplateManagerService.deleteRelationshipTemplate(templateId);
    }

    // entities
    static async getAllowedEntitiesTemplates(userPermissions: Omit<IPermissionsOfUser, 'user'>) {
        const searchBody: ISearchEntityTemplatesBody = {};

        const { templatesManagementId, instancesPermissions } = userPermissions;

        if (!templatesManagementId) {
            const allowedCategories = instancesPermissions.map((permission) => permission.category);

            searchBody.categoryIds = allowedCategories;
        }

        return EntityTemplateManagerService.searchEntityTemplates(searchBody);
    }

    // rules
    static async updateRuleStatusById(ruleId: string, disabled: boolean) {
        // todo: if disabling, check no open requests, search in rule-breaches
        // if (!disabled) {

        // }

        return RelationshipsTemplateManagerService.updateRuleStatusById(ruleId, disabled);
    }

    static async deleteRuleById(ruleId: string) {
        const alerts = await RuleBreachService.getRuleBreachAlertsByRuleId(ruleId);
        const requests = await RuleBreachService.getRuleBreachRequestsByRuleId(ruleId);
        if (alerts.length !== 0 || requests.length !== 0) {
            throw new ServiceError(400, 'rules has alerts/requests', { errorCode: ruleHasAlertsOrRequests });
        }
        return RelationshipsTemplateManagerService.deleteRuleById(ruleId);
    }
}

export default TemplatesManager;
