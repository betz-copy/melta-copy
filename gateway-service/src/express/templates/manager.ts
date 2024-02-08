/* eslint-disable no-param-reassign */
import { AxiosError } from 'axios';
import lodashUniqby from 'lodash.uniqby';
import _isEqual from 'lodash.isequal';
import {
    EntityTemplateManagerService,
    ICategory,
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplatesBody,
} from '../../externalServices/entityTemplateManager';
import { InstanceManagerService } from '../../externalServices/instanceManager';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { trycatch } from '../../utils';
import { removeTmpFile } from '../../utils/fs';
import { ServiceError } from '../error';
import PermissionsManager from '../permissions/manager';
import config from '../../config';
import { IRule } from './rules/interfaces';
import { getParametersOfFormula } from './rules';
import { IFormula } from './rules/interfaces/formula';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import { IEntityTemplateWithConstraints, IMongoEntityTemplateWithConstraints, IMongoEntityTemplateWithConstraintsPopulated } from './interfaces';
import { ProcessManagerService } from '../../externalServices/processService';
import ProcessTemplatesManager from '../processes/processTemplates/manager';
import { isProcessManager } from '../../externalServices/permissionsApi';
import { IPermissionsOfUser } from '../permissions/interfaces';

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
        uniqueConstraints: string[][],
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

    static async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        file?: Express.Multer.File,
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await EntityTemplateManagerService.getCategoryById(updatedTemplateData.category);

        const { count } = await InstanceManagerService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        const currTemplate = await EntityTemplateManagerService.getEntityTemplateById(id);

        if (currTemplate.disabled === true) throw new ServiceError(400, 'can not update disabled template');

        if (count > 0) {
            if (updatedTemplateData.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');

            Object.entries(updatedTemplateData.properties.properties).forEach(([key, value]) => {
                if (value.serialCurrent !== undefined && !currTemplate.properties.properties[key]) {
                    throw new ServiceError(400, 'can not add serialField');
                }
            });

            Object.entries(currTemplate.properties.properties).forEach(([key, value]) => {
                const newValue = updatedTemplateData.properties.properties[key];
                if (!newValue) throw new ServiceError(400, 'can not remove property');

                if (value.serialCurrent !== undefined) {
                    // eslint-disable-next-line no-param-reassign
                    updatedTemplateData.properties.properties[key].serialCurrent = value.serialCurrent;
                }
                if (value.type !== newValue.type) throw new ServiceError(400, 'can not change property type');
                if (value.format !== newValue.format) throw new ServiceError(400, 'can not change property format');
                // changed check for removing options.
                if (newValue.enum && value.enum && value.enum.length > newValue.enum?.length)
                    throw new ServiceError(400, 'can not remove properties of the enum');
                if (value.serialStarter !== newValue.serialStarter) throw new ServiceError(400, 'can not change property serial starter');
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

        const { uniqueConstraints, properties, ...restOfTemplateData } = updatedTemplateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;
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

    static async updateEntityFieldValue(id: string, field: string, values: any, fieldValue: string) {
        const template = await EntityTemplateManagerService.getEntityTemplateById(id);
        if (!values.options) {
            throw new ServiceError(404, 'No options array');
        }
        const index = values.options.indexOf(fieldValue);
        if (index === -1) {
            throw new ServiceError(404, 'Field value not found in options array');
        }

        const templateEnumFieldValues = [...values.options];
        templateEnumFieldValues[index] = field;
        const propertiesToKeep = ['name', 'displayName','category', 'properties', 'iconFileId', 'propertiesOrder', 'propertiesPreview'];
        const templateWithoutProperties = Object.keys(template).reduce((newTemplate, key) => {
            if (propertiesToKeep.includes(key)) {
                newTemplate[key] = template[key];
            }
            // chnage only the fieldName not to the new color
            if (key === 'enumPropertiesColors' && values.optionColors?.[fieldValue] !== undefined) {
                const newFieldName = {
                    ...values.optionColors,
                    [field]: values.optionColors[fieldValue],
                };
                delete newFieldName[fieldValue];
                newTemplate[key] = { [values.name]: { ...newFieldName } };
            }
            return newTemplate;
        }, {} as IEntityTemplatePopulated);
        templateWithoutProperties.properties.properties[values.name].enum = templateEnumFieldValues;

        try {
            await EntityTemplateManagerService.updateEntityTemplate(id, {
                ...templateWithoutProperties,
                category: templateWithoutProperties.category._id,
            } as Omit<IEntityTemplate, 'disabled'>);
            console.log('Initial mongoDB update worked');
        } catch (error) {
            console.error('Initial mongoDB update failed', error);
            throw error;
        }
        // change the values in neo4j if the mongo worked.
        try {
            await InstanceManagerService.updateListFieldOfEntity(id, field, fieldValue, values);
        } catch (neoError: any) {
            if (neoError.response.status === 404) {
                console.error('Neo4j update failed: Node not found');
                // if not found, its not an error.
                return field;
            }
            console.warn('Neo4j update failed: starting roll-back', neoError.message, neoError.response.status);
            
            const templateEnumFieldValues = [...values.options];
            templateEnumFieldValues[index] = fieldValue;
            template.properties.properties[values.name].enum = templateEnumFieldValues;
            const rollBackTemplateWithoutProperties = Object.keys(template).reduce((newTemplate, key) => {
                if (propertiesToKeep.includes(key)) {
                    // eslint-disable-next-line no-param-reassign
                    newTemplate[key] = template[key];
                }
                if (key === 'enumPropertiesColors' && values.optionColors?.[field] !== undefined) {
                    newTemplate[key] = { ...values.optionColors };
                }
                return newTemplate;
            }, {} as IEntityTemplatePopulated);

            try {
                await EntityTemplateManagerService.updateEntityTemplate(id, {
                    ...rollBackTemplateWithoutProperties,
                    category: templateWithoutProperties.category._id,
                } as Omit<IEntityTemplate, 'disabled'>);
                return rollBackTemplateWithoutProperties;
            } catch (error) {
                console.error('RollBack mongoDB update failed');
                throw error;
            }
        }
        return field;
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
