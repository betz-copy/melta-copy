import { AxiosError } from 'axios';
import lodashUniqby from 'lodash.uniqby';
import _isEqual from 'lodash.isequal';
import {
    EntityTemplateService,
    ICategory,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplatesBody,
} from '../../externalServices/entityTemplateService';
import { InstancesService } from '../../externalServices/instanceService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { StorageService } from '../../externalServices/storageService';
import { trycatch } from '../../utils';
import { removeTmpFile } from '../../utils/fs';
import { ServiceError } from '../error';
import config from '../../config';
import { IRule } from './rules/interfaces';
import { getParametersOfFormula } from './rules';
import { IFormula } from './rules/interfaces/formula';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import { IEntityTemplateWithConstraints, IMongoEntityTemplateWithConstraints, IMongoEntityTemplateWithConstraintsPopulated } from './interfaces';
import { ProcessService } from '../../externalServices/processService';
import ProcessTemplatesManager from '../processes/processTemplates/manager';
import DefaultManagerProxy from '../../utils/express/manager';

const {
    categoryHasTemplates,
    entityTemplateHasOutgoingRelationships,
    entityTemplateHasIncomingRelationships,
    entityTemplateHasInstances,
    relationshipTemplateHasInstances,
    relationshipTemplateHasRules,
    ruleHasAlertsOrRequests,
} = config.errorCodes;

export class TemplatesManager extends DefaultManagerProxy<EntityTemplateService> {
    private storageService: StorageService;

    private relationshipTemplateService: RelationshipsTemplateService;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private processService: ProcessService;

    private ruleBreachService: RuleBreachService;

    constructor(workspaceId: string) {
        super(new EntityTemplateService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.processService = new ProcessService(workspaceId);
        this.ruleBreachService = new RuleBreachService(workspaceId);
    }

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

    private async getAllowedRules(allowedRelationshipsTemplates: IRelationshipTemplate[], allowedEntityTemplatesIdsByOneRelationship: string[]) {
        const allowedRelationshipsTemplatesIds = allowedRelationshipsTemplates.map(({ _id }) => _id);

        const rulesByAllowedRelationshipTemplates = await this.relationshipTemplateService.searchRules({
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
        const rulesPinnedByEntityTemplatesByOneRelationship = await this.relationshipTemplateService.searchRules({
            pinnedEntityTemplateIds: allowedEntityTemplatesIdsByOneRelationship,
        });

        const allowedRules: IRule[] = lodashUniqby([...rulesByAllowedRelationshipTemplates, ...rulesPinnedByEntityTemplatesByOneRelationship], '_id');

        const allowedRelationshipTemplatesIdsBecauseOfRules = allowedRules
            .map(({ relationshipTemplateId }) => relationshipTemplateId)
            .filter((relationshipTemplateId) => !allowedRelationshipsTemplatesIds.includes(relationshipTemplateId));

        const allowedRelationshipTemplatesBecauseOfRules = await this.relationshipTemplateService.searchRelationshipTemplates({
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

        const allowedEntityTemplatesBecauseOfRules = await this.entityTemplateService.searchEntityTemplates({
            ids: unknownUnpinnedEntityTemplatesIdsOfAllowedRules,
        });

        return {
            allowedRules,
            allowedRelationshipTemplatesBecauseOfRules,
            allowedEntityTemplatesBecauseOfRules,
        };
    }

    // all
    async getAllAllowedTemplates(userId: string, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const [allCategories, allowedEntityTemplates] = await Promise.all([
            this.getAllCategories(),
            this.getAllowedEntitiesTemplates(permissionsOfUserId),
        ]);

        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const [allowedRelationshipsTemplatesBySource, allowedRelationshipsTemplatesByDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: allowedEntityTemplatesIds }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: allowedEntityTemplatesIds }),
        ]);

        const allowedRelationshipsTemplates = lodashUniqby(
            [...allowedRelationshipsTemplatesByDestination, ...allowedRelationshipsTemplatesBySource],
            '_id',
        );

        const allowedEntityTemplatesIdsByOneRelationship = TemplatesManager.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            allowedRelationshipsTemplatesBySource,
            allowedRelationshipsTemplatesByDestination,
            allowedEntityTemplatesIds,
        );

        const [
            allowedEntityTemplatesByOneRelationship,
            { allowedRules, allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesBecauseOfRules },
            processTemplatesBeforePopulate,
        ] = await Promise.all([
            this.entityTemplateService.searchEntityTemplates({ ids: allowedEntityTemplatesIdsByOneRelationship }),
            this.getAllowedRules(allowedRelationshipsTemplates, allowedEntityTemplatesIdsByOneRelationship),
            this.processService.searchProcessTemplates((await isProcessManager(userId)) ? {} : { reviewerId: userId }),
        ]);

        const [allAllowedEntityTemplatesWithConstraints, processTemplates] = await Promise.all([
            this.getAndPopulateAllTemplatesConstraints([
                ...allowedEntityTemplates,
                ...allowedEntityTemplatesByOneRelationship,
                ...allowedEntityTemplatesBecauseOfRules,
            ]),
            Promise.all(
                processTemplatesBeforePopulate.map((processTemplate) =>
                    ProcessTemplatesManager.getTemplateWithPopulatedStepReviewers(processTemplate),
                ),
            ),
        ]);

        return {
            categories: allCategories,
            entityTemplates: allAllowedEntityTemplatesWithConstraints,
            relationshipTemplates: [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules],
            rules: allowedRules,
            processTemplates,
        };
    }

    async getAllAllowedEntityTemplates(permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId);
        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const [allowedRelationshipsTemplatesBySource, allowedRelationshipsTemplatesByDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: allowedEntityTemplatesIds }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: allowedEntityTemplatesIds }),
        ]);

        const allowedEntityTemplatesIdsByOneRelationship = TemplatesManager.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
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

    async createCategory(categoryData: Omit<ICategory, 'iconFileId'>, file?: Express.Multer.File) {
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
            return this.entityTemplateService.createCategory({ ...categoryData, iconFileId: newFileId });
        }

        return this.entityTemplateService.createCategory({ ...categoryData, iconFileId: null });
    }

    // TODO: race condition here
    async deleteCategory(id: string) {
        const templates = await this.entityTemplateService.searchEntityTemplates({ categoryIds: [id] });
        if (templates.length > 0) {
            throw new ServiceError(400, 'category still has entity templates', { errorCode: categoryHasTemplates });
        }

        const category = await this.entityTemplateService.getCategoryById(id);

        // deleting first the category so if it will fail, the icon and the permissions wont be deleted
        await this.entityTemplateService.deleteCategory(id);

        if (category.iconFileId !== null) {
            await trycatch(() => this.storageService.deleteFile(category.iconFileId!));
        }

        await trycatch(() => PermissionsManager.deletePermissionsOfCategory(id));
    }

    async updateCategory(id: string, updatedData: Partial<ICategory> & { file?: string }, file?: Express.Multer.File) {
        const { iconFileId } = await this.entityTemplateService.getCategoryById(id);

        if (file) {
            if (iconFileId) {
                await this.storageService.deleteFile(iconFileId);
            }

            const newFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);

            return this.entityTemplateService.updateCategory(id, { ...updatedData, iconFileId: newFileId });
        }

        if (iconFileId && !updatedData.iconFileId) {
            await this.storageService.deleteFile(iconFileId);

            return this.entityTemplateService.updateCategory(id, { ...updatedData, iconFileId: null });
        }

        return this.entityTemplateService.updateCategory(id, updatedData);
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

    private async getAndPopulateAllTemplatesConstraints(entityTemplates: IMongoEntityTemplatePopulated[]) {
        const allConstraints = await this.instancesService.getAllConstraints();

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

    async createEntityTemplate(
        templateData: Omit<IEntityTemplateWithConstraints, 'iconFileId'>,
        file?: Express.Multer.File,
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await this.entityTemplateService.getCategoryById(templateData.category);
        let iconFileId: string | null;
        if (file) {
            iconFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
        } else {
            iconFileId = null;
        }

        const { uniqueConstraints, properties, ...restOfTemplateData } = templateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        const entityTemplate = await this.entityTemplateService.createEntityTemplate({
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
        });

        await this.instancesService.updateConstraintsOfTemplate(entityTemplate._id, { requiredConstraints, uniqueConstraints });

        return TemplatesManager.populateTemplateConstraints(entityTemplate, requiredConstraints, uniqueConstraints);
    }

    async throwIfEntityHasRelationships(id: string) {
        const outgoingRelationships = await this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: [id] });
        if (outgoingRelationships.length > 0) {
            throw new ServiceError(400, 'entity template still has outgoing relationships', {
                errorCode: entityTemplateHasOutgoingRelationships,
            });
        }
        const incomingRelationships = await this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: [id] });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(400, 'entity template still has incoming relationships', {
                errorCode: entityTemplateHasIncomingRelationships,
            });
        }
    }

    async throwIfEntityTemplateHasInstances(id: string) {
        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        if (count > 0) {
            throw new ServiceError(400, 'entity template still has instances', { errorCode: entityTemplateHasInstances });
        }
    }

    async deleteEntityTemplate(id: string): Promise<IMongoEntityTemplateWithConstraints> {
        await this.throwIfEntityHasRelationships(id);
        await this.throwIfEntityTemplateHasInstances(id);

        const { iconFileId } = await this.entityTemplateService.getEntityTemplateById(id);
        if (iconFileId) {
            await this.storageService.deleteFile(iconFileId);
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

    async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        file?: Express.Multer.File,
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await this.entityTemplateService.getCategoryById(updatedTemplateData.category);

        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1 });
        const currTemplate = await this.entityTemplateService.getEntityTemplateById(id);

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
                if (value.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                    throw new ServiceError(400, 'can not remove options from enum');
                if (value.serialStarter !== newValue.serialStarter) throw new ServiceError(400, 'can not change property serial starter');
            });
        }

        let iconFileId: string | null;
        if (file) {
            if (currTemplate.iconFileId) {
                await this.storageService.deleteFile(currTemplate.iconFileId);
            }

            iconFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
        } else if (currTemplate.iconFileId && !updatedTemplateData.iconFileId) {
            await this.storageService.deleteFile(currTemplate.iconFileId);

            iconFileId = null;
        } else {
            iconFileId = currTemplate.iconFileId;
        }

        const { uniqueConstraints, properties, ...restOfTemplateData } = updatedTemplateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;
        const updatedTemplate = await this.entityTemplateService.updateEntityTemplate(id, {
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
        });

        await this.instancesService.updateConstraintsOfTemplate(id, {
            uniqueConstraints,
            requiredConstraints,
        });

        return TemplatesManager.populateTemplateConstraints(updatedTemplate, requiredConstraints, uniqueConstraints);
    }

    updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        return this.entityTemplateService.updateEntityTemplateStatus(id, disabledStatus);
    }

    // relationship templates
    private async throwIfEntityTemplateDoesntExist(entityTemplateId: string, errorMessage: string) {
        const { err: getEntityErr } = await trycatch(() => this.entityTemplateService.getEntityTemplateById(entityTemplateId));
        if (getEntityErr) {
            const { response } = getEntityErr as AxiosError;

            if (response?.status === 404) {
                throw new ServiceError(400, errorMessage);
            }
            throw getEntityErr;
        }
    }

    async createRelationshipTemplate(relationshipTemplate: IRelationshipTemplate) {
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        await this.throwIfEntityTemplateDoesntExist(sourceEntityId, 'source entity of relation doesnt exist');
        await this.throwIfEntityTemplateDoesntExist(destinationEntityId, 'destination entity of relation doesnt exist');

        const { disabled: sourceEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(sourceEntityId);
        const { disabled: destinationEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true) {
            throw new ServiceError(400, 'can not create relationship template with disabled entity');
        }

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

        if (sourceEntityDisabled === true || destinationEntityDisabled === true) {
            throw new ServiceError(400, 'can not update relationship template with disabled entity');
        }

        if (relationshipCount > 0) {
            if (updatedFields.name !== currTemplate.name) throw new ServiceError(400, 'can not change template name');
            if (updatedFields.sourceEntityId !== currTemplate.sourceEntityId) throw new ServiceError(400, 'can not change source entity template');
            if (updatedFields.destinationEntityId !== currTemplate.destinationEntityId)
                throw new ServiceError(400, 'can not change destination entity template');
        }

        return this.relationshipTemplateService.updateRelationshipTemplate(templateId, updatedFields);
    }

    static getDependentRelationshipTemplates(formula: IFormula) {
        const parameters = getParametersOfFormula(formula);
        const variablesWithAggregation = parameters.filter(({ variableName }) => variableName.split('.').length === 3);
        const relationshipTemplates = variablesWithAggregation.map(({ variableName }) => variableName.split('.')[1]);

        return [...new Set(relationshipTemplates)];
    }

    async deleteRelationshipTemplate(templateId: string) {
        const relationshipCount = await this.instancesService.getRelationshipsCountByTemplateId(templateId);
        if (relationshipCount !== 0) {
            throw new ServiceError(400, 'relationship template still has instances', { errorCode: relationshipTemplateHasInstances });
        }

        const relationshipTemplate = await this.relationshipTemplateService.getRelationshipTemplateById(templateId);
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const relationshipRelatedRules = await this.relationshipTemplateService.searchRules({ relationshipTemplateIds: [templateId] });
        const sourceRelatedRules = await this.relationshipTemplateService.searchRules({ pinnedEntityTemplateIds: [sourceEntityId] });
        const destinationRelatedRules = await this.relationshipTemplateService.searchRules({ pinnedEntityTemplateIds: [destinationEntityId] });

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

        return this.relationshipTemplateService.deleteRelationshipTemplate(templateId);
    }

    // entities
    async getAllowedEntitiesTemplates(userPermissions: Omit<IPermissionsOfUser, 'user'>) {
        const searchBody: ISearchEntityTemplatesBody = {};

        const { templatesManagementId, instancesPermissions } = userPermissions;

        if (!templatesManagementId) {
            const allowedCategories = instancesPermissions.map((permission) => permission.category);

            searchBody.categoryIds = allowedCategories;
        }

        return this.entityTemplateService.searchEntityTemplates(searchBody);
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
            throw new ServiceError(400, 'rules has alerts/requests', { errorCode: ruleHasAlertsOrRequests });
        }
        return this.relationshipTemplateService.deleteRuleById(ruleId);
    }
}

export default TemplatesManager;
