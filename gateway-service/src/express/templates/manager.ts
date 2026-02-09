import {
    BadRequestError,
    ConfigTypes,
    DashboardItemType,
    IAxisField,
    ICategory,
    ICategoryOrderConfig,
    IChartType,
    IChildTemplate,
    IChildTemplatePopulated,
    IChildTemplateWithConstraintsPopulated,
    IColumnOrLineMetaData,
    IConstraintsOfTemplate,
    IEntity,
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityTemplatePopulated,
    IEntityTemplateWithConstraints,
    IFormula,
    IFullMongoEntityTemplate,
    IMongoBaseConfig,
    IMongoCategory,
    IMongoCategoryOrderConfig,
    IMongoEntityTemplatePopulated,
    IMongoEntityTemplateWithConstraints,
    IMongoEntityTemplateWithConstraintsPopulated,
    IMongoPrintingTemplate,
    IMongoRelationshipTemplate,
    IMongoRule,
    INUmberMetaData,
    IPieMetaData,
    IPrintingTemplate,
    IRelationship,
    IRule,
    ISearchEntityTemplatesBody,
    ISearchRelationshipTemplatesBody,
    ISearchRulesBody,
    ISubCompactPermissions,
    IUniqueConstraintOfTemplate,
    IUpdateOrDeleteEnumFieldReqData,
    isChildTemplate,
    logger,
    MongoBaseFields,
    NotFoundError,
    PermissionScope,
    PermissionType,
    RelatedPermission,
    ServiceError,
    TableItem,
    UploadedFile,
    ValidationError,
} from '@microservices/shared';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import _, { groupBy, isEqual, omit, uniqBy } from 'lodash';
import config from '../../config';
import DashboardItemService from '../../externalServices/dashboardService/dashboardItemService';
import GanttsService from '../../externalServices/ganttsService';
import InstancesService from '../../externalServices/instanceService';
import Kartoffel from '../../externalServices/kartoffel';
import ProcessService from '../../externalServices/processService';
import RuleBreachService from '../../externalServices/ruleBreachService';
import StorageService from '../../externalServices/storageService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import PrintingTemplateService from '../../externalServices/templates/printingTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import { tryCatch } from '../../utils';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import {
    buildNewRelationshipField,
    updateChildTemplatesOnParentUpdate,
    validateNoDependentRules,
    validateRequiredConstraints,
    validateUniqueRelationships,
} from '../../utils/templates';
import { prepareChartForUpdate, prepareDashboardItemForUpdate, processAndUpdateItems } from '../../utils/templates/deletePropertyFromFilter';
import InstancesManager from '../instances/manager';
import ProcessTemplatesManager from '../processes/processTemplates/manager';
import ChartManager from '../templateCharts/manager';
import UsersManager from '../users/manager';
import { getParametersOfFormula } from './rules';
import checkPropertyInUsedFromFormula from './rules/checkIfPropertyInUsed';

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

    private printingTemplateService: PrintingTemplateService;

    private instancesService: InstancesService;

    private processService: ProcessService;

    private processManager: ProcessTemplatesManager;

    private instanceManager: InstancesManager;

    private ruleBreachService: RuleBreachService;

    private ganttService: GanttsService;

    constructor(private workspaceId: string) {
        super(new EntityTemplateService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.printingTemplateService = new PrintingTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.processService = new ProcessService(workspaceId);
        this.processManager = new ProcessTemplatesManager(workspaceId);
        this.instanceManager = new InstancesManager(workspaceId);
        this.ruleBreachService = new RuleBreachService(workspaceId);
        this.ganttService = new GanttsService(workspaceId);
    }

    async getAllowedEntityTemplateIds(
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        userId: string,
        searchBody?: ISearchRelationshipTemplatesBody,
    ) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, userId, searchBody);
        return allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);
    }

    async getAllowedRelationshipTemplates(entityTemplateIds: string[]) {
        const [bySource, byDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: entityTemplateIds }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: entityTemplateIds }),
        ]);

        return uniqBy([...bySource, ...byDestination], '_id');
    }

    async getAllowedRelationshipTemplatesIds(entityTemplateIds: string[]): Promise<string[]> {
        const allowedRelationshipTemplates = await this.getAllowedRelationshipTemplates(entityTemplateIds);
        return allowedRelationshipTemplates.map(({ _id }) => _id);
    }

    async getAllowedTemplatesAndRules(entityTemplateIds: string[], relationshipTemplates: IMongoRelationshipTemplate[], userId: string) {
        const allowedEntityTemplatesIdsByOneRelationship = this.getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
            relationshipTemplates,
            relationshipTemplates,
            entityTemplateIds,
        );

        const { allowedRelationshipTemplatesBecauseOfRules } = await this.getAllowedRules(
            entityTemplateIds,
            relationshipTemplates,
            allowedEntityTemplatesIdsByOneRelationship,
            userId,
        );

        return { allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesIdsByOneRelationship };
    }

    // get all entityTemplates that are one relationship (step) away  from the original users permissions
    private getAllEntityTemplateThatAreOneRelationshipAwayFromUsersPermissions(
        allowedRelationshipsTemplatesBySource: IMongoRelationshipTemplate[],
        allowedRelationshipsTemplatesByDestination: IMongoRelationshipTemplate[],
        allowedEntityTemplatesIds: string[],
    ) {
        const extendedAllowedRelationshipsTemplatesIds = new Set<string>();

        allowedRelationshipsTemplatesBySource.forEach((relationshipTemplate: IMongoRelationshipTemplate) => {
            const { destinationEntityId } = relationshipTemplate;

            if (!allowedEntityTemplatesIds.includes(destinationEntityId)) {
                extendedAllowedRelationshipsTemplatesIds.add(destinationEntityId);
            }
        });

        allowedRelationshipsTemplatesByDestination.forEach((relationshipTemplate: IMongoRelationshipTemplate) => {
            const { sourceEntityId } = relationshipTemplate;

            if (!allowedEntityTemplatesIds.includes(sourceEntityId)) {
                extendedAllowedRelationshipsTemplatesIds.add(sourceEntityId);
            }
        });

        return Array.from(extendedAllowedRelationshipsTemplatesIds);
    }

    private async getAllowedRules(
        allowedEntityTemplatesIds: string[],
        allowedRelationshipsTemplates: IMongoRelationshipTemplate[],
        allowedEntityTemplatesIdsByOneRelationship: string[],
        userId: string,
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

        const allowedRules: IRule[] = uniqBy([...rulesByAllowedEntityTemplates, ...rulesOfEntityTemplatesByOneRelationship], '_id');

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

        const allowedEntityTemplatesBecauseOfRules = await this.entityTemplateService.searchEntityTemplates(userId, {
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
        const [allAllowedCategories, allowedEntityTemplates] = await Promise.all([
            this.getAllAllowedCategories(permissionsOfUserId),
            this.getAllowedEntitiesTemplates(permissionsOfUserId, userId),
        ]);

        const allowedEntityTemplatesIds = allowedEntityTemplates.map(({ _id }) => _id);

        const childTemplatesPopulated = await this.getAllowedChildEntitiesTemplates(permissionsOfUserId);

        const allowedChildTemplatesIds = childTemplatesPopulated
            .map(({ parentTemplate: { _id } }) => _id)
            .filter((id) => !allowedEntityTemplatesIds.includes(id));

        const allowedRelationshipsTemplates = await this.getAllowedRelationshipTemplates([...allowedEntityTemplatesIds, ...allowedChildTemplatesIds]);
        const { allowedRelationshipTemplatesBecauseOfRules, allowedEntityTemplatesIdsByOneRelationship } = await this.getAllowedTemplatesAndRules(
            allowedEntityTemplatesIds,
            allowedRelationshipsTemplates,
            userId,
        );

        const [allowedEntityTemplatesByOneRelationship, { allowedRules, allowedEntityTemplatesBecauseOfRules }, processTemplatesBeforePopulate] =
            await Promise.all([
                this.entityTemplateService.searchEntityTemplates(userId, { ids: allowedEntityTemplatesIdsByOneRelationship }),
                this.getAllowedRules(allowedEntityTemplatesIds, allowedRelationshipsTemplates, allowedEntityTemplatesIdsByOneRelationship, userId),
                this.processService.searchProcessTemplates(permissionsOfUserId.admin || permissionsOfUserId.processes ? {} : { reviewerId: userId }),
            ]);

        const allAllowedEntityTemplates = [
            ...allowedEntityTemplates,
            ...allowedEntityTemplatesByOneRelationship,
            ...allowedEntityTemplatesBecauseOfRules,
        ].filter((template): template is IMongoEntityTemplatePopulated => !!template && typeof template !== 'string');

        const uniqueConstraints = await this.instancesService.getAllConstraints();

        const [allAllowedEntityTemplatesWithConstraints, ...processTemplates] = await Promise.all([
            this.getAndPopulateAllTemplatesConstraints(allAllowedEntityTemplates, uniqueConstraints),
            ...processTemplatesBeforePopulate.map((processTemplate) => this.processManager.getTemplateWithPopulatedStepReviewers(processTemplate)),
        ]);

        let categoryOrder: IMongoCategoryOrderConfig | null;
        try {
            const workspaceConfig = await this.getConfigByType(ConfigTypes.CATEGORY_ORDER, permissionsOfUserId);
            categoryOrder = workspaceConfig as IMongoCategoryOrderConfig;
        } catch {
            categoryOrder = null;
        }

        const allPrintingTemplates: IMongoPrintingTemplate[] = await this.printingTemplateService.getAllPrintingTemplates();

        return {
            categoryOrder,
            categories: allAllowedCategories,
            entityTemplates: allAllowedEntityTemplatesWithConstraints,
            relationshipTemplates: [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules],
            rules: allowedRules,
            processTemplates,
            childTemplates: await this.getAndPopulateAllTemplatesConstraints(childTemplatesPopulated, uniqueConstraints),
            printingTemplates: allPrintingTemplates,
        };
    }

    async getAllAllowedRelationshipTemplates(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], userId: string) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, userId);
        const allowedEntityTemplatesIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        return this.relationshipTemplateService.searchRelationshipTemplates({
            sourceEntityIds: allowedEntityTemplatesIds,
            destinationEntityIds: allowedEntityTemplatesIds,
        });
    }

    async getAllAllowedEntityTemplates(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], userId: string) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, userId);
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

        const allowedEntityTemplatesByOneRelationship = await this.entityTemplateService.searchEntityTemplates(userId, {
            ids: allowedEntityTemplatesIdsByOneRelationship,
        });

        return [...allowedEntityTemplates, ...allowedEntityTemplatesByOneRelationship];
    }

    // categories
    private async updateNewCategoryScope(category: IMongoCategory, permissionsOfUserId: ISubCompactPermissions, userId: string) {
        const updatedPermissions = permissionsOfUserId.admin
            ? permissionsOfUserId
            : {
                  ...permissionsOfUserId,
                  instances: {
                      ...permissionsOfUserId.instances,
                      categories: {
                          ...permissionsOfUserId.instances?.categories,
                          [category._id]: { scope: PermissionScope.write, entityTemplates: {} },
                      },
                  },
              };

        await UsersManager.syncUserPermissions(userId, RelatedPermission.User, {
            [this.workspaceId]: updatedPermissions,
        });
    }

    async getAllAllowedCategories(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId']) {
        return this.entityTemplateService.searchCategories(permissionsOfUserId);
    }

    async createCategory(
        categoryData: Omit<ICategory, 'iconFileId'>,
        permissionsOfUserId: ISubCompactPermissions,
        userId: string,
        file?: UploadedFile,
    ) {
        const iconFileId = file ? await this.storageService.uploadFile(file) : null;

        const newCategory = await this.entityTemplateService.createCategory({ ...categoryData, iconFileId });
        await this.updateNewCategoryScope(newCategory, permissionsOfUserId, userId);
        return newCategory;
    }

    // TODO: race condition here
    async deleteCategory(id: string, userId: string) {
        const templates = await this.entityTemplateService.searchEntityTemplates(userId, { categoryIds: [id] });
        if (templates.length > 0) {
            throw new BadRequestError('category still has entity templates', { errorCode: categoryHasTemplates });
        }

        const category = await this.entityTemplateService.getCategoryById(id);

        // deleting first the category so if it will fail, the icon and the permissions wont be deleted
        await this.entityTemplateService.deleteCategory(id);

        if (category.iconFileId !== null) {
            await tryCatch(() => this.storageService.deleteFile(category.iconFileId!));
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

    async updateCategoryTemplatesOrder(templateId: string, newIndex: number, srcCategoryId: string, newCategoryId: string) {
        return this.entityTemplateService.updateCategoryTemplatesOrder(templateId, newIndex, srcCategoryId, newCategoryId);
    }

    // config
    async getAllConfigs(permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId']): Promise<IMongoBaseConfig[]> {
        return this.entityTemplateService.getConfigs(permissionsOfUserId);
    }

    async getConfigByType(type: ConfigTypes, permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId']): Promise<IMongoBaseConfig> {
        return this.entityTemplateService.getConfigByType(type, permissionsOfUserId);
    }

    async updateCategoryOrderConfig(configId: string, newIndex: number, item: string): Promise<IMongoCategoryOrderConfig> {
        return this.entityTemplateService.updateOrderConfig(configId, newIndex, item);
    }

    async createCategoryOrderConfig(configData: ICategoryOrderConfig): Promise<IMongoCategoryOrderConfig> {
        return this.entityTemplateService.createOrderConfig(configData);
    }

    // entity templates
    private populateTemplateConstraints<T extends IMongoEntityTemplatePopulated | IChildTemplatePopulated | IFullMongoEntityTemplate>(
        entityTemplate: T,
        requiredConstraints: string[],
        uniqueConstraints: IUniqueConstraintOfTemplate[],
    ): T & { uniqueConstraints: IUniqueConstraintOfTemplate[]; properties: T['properties'] & { required: string[] } } {
        return {
            ...entityTemplate,
            properties: {
                ...entityTemplate.properties,
                required: requiredConstraints,
            },
            uniqueConstraints,
        };
    }

    async getAndPopulateAllTemplatesConstraints(
        entityTemplates: IChildTemplatePopulated[],
        allConstraints?: IConstraintsOfTemplate[],
    ): Promise<IChildTemplateWithConstraintsPopulated[]>;

    async getAndPopulateAllTemplatesConstraints(
        entityTemplates: IMongoEntityTemplatePopulated[],
        allConstraints?: IConstraintsOfTemplate[],
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated[]>;

    async getAndPopulateAllTemplatesConstraints<T extends IMongoEntityTemplatePopulated | IChildTemplatePopulated>(
        entityTemplates: T[],
        allConstraints?: IConstraintsOfTemplate[],
    ): Promise<T[]> {
        const constraints = allConstraints || (await this.instancesService.getAllConstraints());
        const entityTemplatesWithConstraints = entityTemplates.map((entityTemplate) => {
            const constraintsOfTemplate = constraints.find(({ templateId }) =>
                isChildTemplate(entityTemplate) ? templateId === entityTemplate.parentTemplate._id : templateId === entityTemplate._id,
            );

            const requiredConstraints = constraintsOfTemplate?.requiredConstraints ?? [];
            const uniqueConstraints = constraintsOfTemplate?.uniqueConstraints ?? [];

            if (isChildTemplate(entityTemplate)) {
                entityTemplate.parentTemplate = this.populateTemplateConstraints(
                    entityTemplate.parentTemplate,
                    requiredConstraints,
                    uniqueConstraints,
                );
            }

            return this.populateTemplateConstraints(entityTemplate, requiredConstraints, uniqueConstraints);
        });

        return entityTemplatesWithConstraints as T[];
    }

    private async updateEntityTemplateScope(
        entityTemplate: IMongoEntityTemplatePopulated | IChildTemplatePopulated,
        permissionsOfUserId: ISubCompactPermissions,
        userId: string,
    ) {
        const { admin, instances } = permissionsOfUserId;
        const categoryId = entityTemplate.category._id;
        const categoryScope = instances?.categories?.[categoryId]?.scope;

        if (admin || categoryScope === PermissionScope.write) {
            await UsersManager.syncUserPermissions(userId, RelatedPermission.User, { [this.workspaceId]: permissionsOfUserId });
            return;
        }

        const updatedCategories = {
            ...instances?.categories,
            [categoryId]: {
                scope: categoryScope,
                entityTemplates: {
                    ...instances?.categories?.[categoryId]?.entityTemplates,
                    [entityTemplate._id]: { scope: PermissionScope.write, fields: {} },
                },
            },
        };

        const updatedPermissions: ISubCompactPermissions = {
            ...permissionsOfUserId,
            instances: {
                ...instances,
                categories: updatedCategories,
            },
        };

        await UsersManager.syncUserPermissions(userId, RelatedPermission.User, { [this.workspaceId]: updatedPermissions });
    }

    async updateEntityTemplateAction(templateId: string, actions: string, isChild?: boolean): Promise<IMongoEntityTemplatePopulated> {
        if (isChild) return this.entityTemplateService.updateChildEntityTemplateAction(templateId, actions);
        return this.entityTemplateService.updateEntityTemplateAction(templateId, actions);
    }

    async searchEntityTemplates(
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        searchQuery: ISearchEntityTemplatesBody,
        userId: string,
    ) {
        const allowedEntityTemplates = await this.getAllowedEntitiesTemplates(permissionsOfUserId, userId, searchQuery);
        return this.getAndPopulateAllTemplatesConstraints(allowedEntityTemplates);
    }

    async searchRelationshipTemplates(
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        searchBody: ISearchRelationshipTemplatesBody,
        userId: string,
    ) {
        const allowedEntityTemplatesIds = await this.getAllowedEntityTemplateIds(permissionsOfUserId, userId, searchBody);

        const allowedRelationshipsTemplates = await this.getAllowedRelationshipTemplates(allowedEntityTemplatesIds);

        const { allowedRelationshipTemplatesBecauseOfRules } = await this.getAllowedTemplatesAndRules(
            allowedEntityTemplatesIds,
            allowedRelationshipsTemplates,
            userId,
        );

        return [...allowedRelationshipsTemplates, ...allowedRelationshipTemplatesBecauseOfRules];
    }

    async searchRulesTemplates(
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        searchBody: ISearchRulesBody,
        userId: string,
    ) {
        const allowedEntityTemplatesIds = await this.getAllowedEntityTemplateIds(permissionsOfUserId, userId);
        const searchResults = await this.relationshipTemplateService.searchRules(searchBody);

        return searchResults.filter((rule) => allowedEntityTemplatesIds.includes(rule.entityTemplateId));
    }

    validateConstraintsProperties = (properties: Record<string, IEntitySingleProperty>, requiredConstraints: string[]) => {
        let identifier: string;
        Object.entries(properties).forEach(([key, value]) => {
            const isComment = value.comment || value.hideFromDetailsPage || value.format === 'comment';
            if (value.readOnly && requiredConstraints.includes(key)) throw new BadRequestError(`${key} property can't be both readOnly and required`);
            if (value.archive && requiredConstraints.includes(key)) throw new BadRequestError(`${key} property can't be both archive and required`);
            if (value.identifier) {
                if (identifier) throw new BadRequestError(`can't be more than one identifier: ${key}, ${identifier}`);
                identifier = key;
                if (!requiredConstraints.includes(key)) throw new BadRequestError(`${key} property identifier has to be required`);
            }
            if (value.serialCurrent && !requiredConstraints.includes(key))
                throw new BadRequestError(`${key} property serial number has to be required`);
            if (isComment && requiredConstraints.includes(key)) throw new BadRequestError(`${key} property comment can't be required`);
            if (isComment && value.archive) throw new BadRequestError(`${key} property comment can't be archive`);
        });
    };

    async createEntityTemplate(
        templateData: Omit<IEntityTemplateWithConstraints, 'iconFileId' | 'documentTemplatesIds'>,
        permissionsOfUserId: ISubCompactPermissions,
        userId: string,
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
    ): Promise<IMongoEntityTemplateWithConstraintsPopulated> {
        await this.entityTemplateService.getCategoryById(templateData.category);
        let iconFileId: string | null = null;

        if (file?.[0]) {
            [iconFileId] = await this.storageService.uploadFiles([file[0]]);
        }

        const documentFiles = (files ?? []).filter((f) => f.fieldname.toLowerCase() !== 'file' && f.fieldname.toLowerCase() !== 'icon');

        const uploadedDocumentTemplates = documentFiles.length ? await this.storageService.uploadFiles(documentFiles) : [];

        const { uniqueConstraints, properties, ...restOfTemplateData } = templateData;
        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        this.validateConstraintsProperties(restOfTemplatePropertiesObject.properties, requiredConstraints);

        const entityTemplate = await this.entityTemplateService.createEntityTemplate({
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
            documentTemplatesIds: uploadedDocumentTemplates,
        });

        await this.instancesService.updateConstraintsOfTemplate(entityTemplate._id, {
            requiredConstraints,
            uniqueConstraints,
        });

        await this.updateEntityTemplateScope(entityTemplate, permissionsOfUserId, userId);

        return this.populateTemplateConstraints(entityTemplate, requiredConstraints, uniqueConstraints);
    }

    async createChildTemplate(
        childTemplate: IChildTemplate,
        permissionsOfUserId: ISubCompactPermissions,
        userId: string,
    ): Promise<IChildTemplateWithConstraintsPopulated> {
        const {
            category,
            parentTemplateId,
            properties: { properties },
        } = childTemplate;

        await this.entityTemplateService.getCategoryById(category);
        await this.entityTemplateService.getEntityTemplateById(parentTemplateId);

        const { uniqueConstraints, requiredConstraints } = await this.instancesService.getConstraintsOfTemplate(parentTemplateId);

        const requiredNotInProperties = requiredConstraints.find((requiredKey) => !Object.keys(properties).includes(requiredKey));
        if (requiredNotInProperties) throw new ValidationError(`required key ${requiredNotInProperties} isn't in properties`);

        const createdChildTemplate = await this.entityTemplateService.createChildTemplate(childTemplate);

        if (!permissionsOfUserId?.admin) await this.updateEntityTemplateScope(createdChildTemplate, permissionsOfUserId, userId);

        const { uniqueConstraints: currUnique, requiredConstraints: currRequired } =
            await this.instancesService.getConstraintsOfTemplate(parentTemplateId);

        const parentWithConstraints = this.populateTemplateConstraints(createdChildTemplate.parentTemplate, currRequired, currUnique);

        return this.populateTemplateConstraints(
            { ...createdChildTemplate, parentTemplate: parentWithConstraints },
            requiredConstraints,
            uniqueConstraints,
        );
    }

    entityHasRelationshipNotReference(entityTemplateToDelete: IMongoEntityTemplatePopulated, relationships: IMongoRelationshipTemplate[]) {
        return relationships.some((relationship) => {
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
        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1, skip: 0, showRelationships: false, sort: [] });
        if (count > 0) {
            throw new BadRequestError('entity template still has instances', { errorCode: entityTemplateHasInstances });
        }
    }

    async deleteEntityTemplate(id: string): Promise<IMongoEntityTemplateWithConstraints> {
        const entityTemplateToDelete = await this.entityTemplateService.getEntityTemplateById(id);
        await this.throwIfEntityHasRelationships(entityTemplateToDelete);
        await this.throwIfEntityTemplateHasInstances(id);

        if (entityTemplateToDelete.iconFileId) await this.storageService.deleteFile(entityTemplateToDelete.iconFileId);

        await this.instancesService.updateConstraintsOfTemplate(id, { requiredConstraints: [], uniqueConstraints: [] });

        const entityTemplate = await this.entityTemplateService.deleteEntityTemplate(id);

        return {
            ...entityTemplate,
            properties: {
                ...entityTemplate.properties,
                required: [],
            } as IMongoEntityTemplateWithConstraints['properties'],
            uniqueConstraints: [] as IMongoEntityTemplateWithConstraints['uniqueConstraints'],
        } as IMongoEntityTemplateWithConstraints;
    }

    async updateNewSerialNumberFields(
        id: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'>,
        currTemplate: IMongoEntityTemplatePopulated,
    ) {
        const updatedSerialNumberFields = Object.keys(updatedTemplateData.properties.properties).filter(
            (key) => updatedTemplateData.properties.properties[key].serialCurrent !== undefined,
        );

        const newSerialNumberFields = updatedSerialNumberFields.filter((key) => !(key in currTemplate.properties.properties));

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

    private async isPropertyOfTemplateInUsedInRules(templateId: string, properties: string[], archive: boolean) {
        const allRules = await this.relationshipTemplateService.searchRules({});
        return allRules.forEach((rule) => {
            checkPropertyInUsedFromFormula(rule.formula, templateId, properties, archive);
        });
    }

    private async isPropertyOfTemplateInUsedInGantts(entityTemplateId: string, properties: string[], archive: boolean) {
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
                            errorCode: archive ? config.errorCodes.failedToArchiveField : config.errorCodes.failedToDeleteField,
                            type: 'gantts',
                            property,
                        });
                });
            });
        });
    }

    private async isPropertyOfTemplateInUsedInCharts(templateId: string, properties: string[], archive: boolean): Promise<void> {
        const chartManager = new ChartManager(this.workspaceId);
        const allChartsOfTemplate = await chartManager.getChartsByTemplateId(templateId);

        const isPropertyUsed = (field: IAxisField): string | null => {
            if (typeof field === 'string') return properties.includes(field) ? field : null;
            return field.byField && properties.includes(field.byField) ? field.byField : null;
        };

        for (const chart of allChartsOfTemplate) {
            let foundProperty: string | null = null;

            switch (chart.type) {
                case IChartType.Column:
                case IChartType.Line: {
                    const { xAxis, yAxis } = chart.metaData as IColumnOrLineMetaData;
                    foundProperty = isPropertyUsed(xAxis.field) || isPropertyUsed(yAxis.field);
                    break;
                }

                case IChartType.Pie: {
                    const { aggregationType, dividedByField } = chart.metaData as IPieMetaData;
                    foundProperty = isPropertyUsed(dividedByField) || isPropertyUsed(aggregationType);
                    break;
                }

                case IChartType.Number: {
                    const { accumulator } = chart.metaData as INUmberMetaData;
                    foundProperty = isPropertyUsed(accumulator);
                    break;
                }

                default:
                    break;
            }

            if (foundProperty)
                throw new BadRequestError(`Cannot delete field '${foundProperty}' because it is used in chart '${chart._id}'`, {
                    errorCode: archive ? config.errorCodes.failedToArchiveField : config.errorCodes.failedToDeleteField,
                    type: 'charts',
                    property: foundProperty,
                });
        }
    }

    private async checkIfPropertyInUsedBeforeDeleteOrArchive(
        entityTemplate: IMongoEntityTemplatePopulated,
        properties: string[],
        archive: boolean,
        userId: string,
    ) {
        const { _id: templateId } = entityTemplate;

        if (properties.length && properties.some((removedProperty) => entityTemplate.properties.properties[removedProperty].format !== 'comment'))
            await Promise.all([
                this.isPropertyOfTemplateInUsedInGantts(templateId, properties, archive),
                this.isPropertyOfTemplateInUsedInRules(templateId, properties, archive),
                this.isPropertyInUsedAsRelatedFieldInRelationshipReference(templateId, properties, archive, userId),
                this.isPropertyOfTemplateInUsedInCharts(templateId, properties, archive),
            ]);
    }

    private async deletePropertyFromChartFilter(templateId: string, removedProperties: string[]) {
        const chartManager = new ChartManager(this.workspaceId);
        const allChartsOfTemplate = await chartManager.getChartsByTemplateId(templateId);

        return processAndUpdateItems(
            allChartsOfTemplate,
            removedProperties,
            (chart) => chart.filter,
            (chart, filter) => {
                chart.filter = filter;
            },
            (chart) => chart._id,
            (chartId, updatedChart) => chartManager.updateChart(chartId, updatedChart),
            prepareChartForUpdate,
        );
    }

    private async deletePropertyFromTableDashboardFilter(templateId: string, removedProperties: string[]) {
        const dashboardItemService = new DashboardItemService(this.workspaceId);
        const allDashboardItems = await dashboardItemService.searchDashboardItems();

        const filteredTableItems = allDashboardItems.filter(
            ({ type, metaData }) => type === DashboardItemType.Table && metaData.templateId === templateId && metaData.filter,
        ) as (TableItem & MongoBaseFields)[];

        return processAndUpdateItems(
            filteredTableItems,
            removedProperties,
            (item) => item.metaData.filter,
            (item, filter) => {
                item.metaData.filter = filter;
                item.metaData.columns = item.metaData.columns.filter((column) => !removedProperties.includes(column));
            },
            (item) => item._id,
            (itemId, updatedItem) => dashboardItemService.updateDashboardItem(itemId, updatedItem),
            prepareDashboardItemForUpdate,
        );
    }

    private async deleteFilesOfDeletedProperty(templateId: string, removedFilesProperties: Record<string, boolean>, numOfInstances: number) {
        const promises: Promise<void>[] = [];
        const { searchEntitiesChunkSize } = config.service;

        for (let fileIndex = 0; numOfInstances - fileIndex > 0; fileIndex += searchEntitiesChunkSize) {
            promises.push(
                (async () => {
                    const filePaths: string[] = [];
                    const { entities } = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, {
                        limit: searchEntitiesChunkSize,
                        skip: fileIndex,
                        showRelationships: false,
                        sort: [],
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

    private async isPropertyInUsedAsRelatedFieldInRelationshipReference(templateId: string, properties: string[], archive: boolean, userId: string) {
        const allEntityTemplates = await this.entityTemplateService.searchEntityTemplates(userId);

        allEntityTemplates.forEach((entityTemplate) => {
            Object.values(entityTemplate.properties.properties).forEach(({ format, relationshipReference }) => {
                if (
                    format === 'relationshipReference' &&
                    relationshipReference?.relatedTemplateId === templateId &&
                    properties.includes(relationshipReference?.relatedTemplateField)
                ) {
                    throw new BadRequestError('that field is used as relationship reference field', {
                        errorCode: archive ? config.errorCodes.failedToArchiveField : config.errorCodes.failedToDeleteField,
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

                if (format === 'fileId' || items?.format === 'fileId' || format === 'signature') {
                    acc[propertyToRemove] = items?.format === 'fileId';
                }

                return acc;
            },
            {} as Record<string, boolean>,
        );

        if (Object.keys(removedFilesProperties).length) {
            await this.deleteFilesOfDeletedProperty(id, removedFilesProperties, count);
        }
        if (removedProperties.some((removedProperty) => currentTemplate.properties.properties[removedProperty].format !== 'comment')) {
            await this.deletePropertyFromChartFilter(id, removedProperties);
            await this.deletePropertyFromTableDashboardFilter(id, removedProperties);

            const { err } = await tryCatch(() =>
                this.instancesService.deletePropertiesOfTemplate(id, removedProperties, currentTemplate.properties.properties),
            );

            if (err) {
                const manipulatedTemplate = JSON.parse(JSON.stringify(currentTemplate));

                Object.entries(currentTemplate.properties.properties).forEach(([name, value]) => {
                    if (value.format === 'relationshipReference' && value.relationshipReference) {
                        const { relationshipTemplateId: _relationshipTemplateId, ...restData } = value.relationshipReference;
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
    }

    private async handleFiles(
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        currTemplate: IMongoEntityTemplatePopulated,
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
    ) {
        let iconFileId: string | null;

        if (file?.[0]) {
            if (currTemplate.iconFileId) {
                await this.storageService.deleteFile(currTemplate.iconFileId);
            }
            iconFileId = await this.storageService.uploadFile(file[0]);
        } else if (currTemplate.iconFileId && !updatedTemplateData.iconFileId) {
            await this.storageService.deleteFile(currTemplate.iconFileId);
            iconFileId = null;
        } else {
            iconFileId = currTemplate.iconFileId;
        }

        const documentFiles = files?.filter((f) => f.fieldname !== 'file') ?? [];

        const { documentTemplatesIdsToKeep = [], documentTemplatesIdsToDelete = [] } = _.groupBy(
            currTemplate.documentTemplatesIds,
            (documentTemplateId) => {
                return updatedTemplateData.documentTemplatesIds?.includes(documentTemplateId)
                    ? 'documentTemplatesIdsToKeep'
                    : 'documentTemplatesIdsToDelete';
            },
        );

        if (documentTemplatesIdsToDelete.length) {
            await this.storageService.deleteFiles(documentTemplatesIdsToDelete);
        }

        const uploadedDocumentTemplates = documentFiles.length > 0 ? await this.storageService.uploadFiles(documentFiles) : [];

        return {
            iconFileId,
            documentTemplatesIds: [...documentTemplatesIdsToKeep, ...uploadedDocumentTemplates],
        };
    }

    private async updateInstancesWithUserFields(
        templateId: string,
        newExpandedUserFields: string[],
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & {
            file?: string;
        },
        userId: string,
    ) {
        const entities = await this.instanceManager.getAllTemplateEntities(templateId, userId);

        const usersIds = new Set<string>();
        entities.forEach((entity) => {
            newExpandedUserFields.forEach((expandedUserFieldKey) => {
                const userKey = updatedTemplateData.properties.properties[expandedUserFieldKey].expandedUserField?.relatedUserField;
                if (userKey && entity.entity.properties[userKey] && JSON.parse(entity.entity.properties[userKey])._id) {
                    usersIds.add(JSON.parse(entity.entity.properties[userKey])._id);
                }
            });
        });

        const kartoffelUsers = await Promise.all(Array.from(usersIds).map((userId) => Kartoffel.getUserById(userId)));
        const kartoffelUsersMapById = groupBy(kartoffelUsers, (user) => user._id);
        const entitiesToUpdate: IEntity[] = [];

        entities.forEach((entity) => {
            let wasEntityChange = false;
            const entityToUpdate = entity.entity;
            newExpandedUserFields.forEach((expandedUserFieldKey) => {
                const expandedUserFieldValue = updatedTemplateData.properties.properties[expandedUserFieldKey];
                const userKey = expandedUserFieldValue.expandedUserField?.relatedUserField;
                const userFieldValue = userKey ? entity.entity.properties[userKey] : undefined;
                const userId = userFieldValue ? userFieldValue._id : undefined;

                if (userId && userKey) {
                    const kartoffelUser = kartoffelUsersMapById[userId] ? kartoffelUsersMapById[userId][0] : undefined;
                    if (kartoffelUser?.[expandedUserFieldValue.expandedUserField?.kartoffelField || '']) {
                        wasEntityChange = true;
                        entityToUpdate.properties[expandedUserFieldKey] =
                            kartoffelUser[expandedUserFieldValue.expandedUserField?.kartoffelField || ''].toString();
                    }
                }
            });

            if (wasEntityChange) entitiesToUpdate.push(entityToUpdate);
        });

        await Promise.all(
            entitiesToUpdate.map((entityToUpdate) => this.instancesService.updateEntityInstance(entityToUpdate.properties._id, entityToUpdate, [])),
        );
    }

    async updateEntityTemplate(
        id: string,
        userId: string,
        updatedTemplateData: Omit<IEntityTemplateWithConstraints, 'disabled'> & { file?: string },
        { file, files }: { file?: [UploadedFile]; files?: UploadedFile[] },
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ): Promise<{ template: IMongoEntityTemplateWithConstraintsPopulated; childTemplates?: IChildTemplateWithConstraintsPopulated[] }> {
        await this.entityTemplateService.getCategoryById(updatedTemplateData.category);

        const { count } = await this.instancesService.searchEntitiesOfTemplateRequest(id, { limit: 1, skip: 0, showRelationships: false, sort: [] });
        const currTemplate = await this.entityTemplateService.getEntityTemplateById(id);
        const { uniqueConstraints: currUnique } = await this.instancesService.getConstraintsOfTemplate(id);

        const populatedTemplates = await this.getAndPopulateAllTemplatesConstraints([currTemplate]);
        const [populatedCurrTemplate] = populatedTemplates;

        const { required, ...currProperties } = populatedCurrTemplate.properties;

        this.validateConstraintsProperties(currProperties.properties, required);

        if (currTemplate.disabled === true) throw new BadRequestError('can not update disabled template');

        if (!this.checkValidAmountOfArchiveProperties(updatedTemplateData.properties.properties))
            throw new BadRequestError('can not archive all properties');

        const removeRequiredProperties = populatedCurrTemplate.properties.required.filter(
            (property) => !updatedTemplateData.properties.required.includes(property),
        );

        if (removeRequiredProperties.length > 0)
            await this.isPropertyInUsedAsRelatedFieldInRelationshipReference(currTemplate._id, removeRequiredProperties, false, userId);

        const removedProperties: string[] = [];
        const archiveProperties: string[] = [];
        const propertiesKeysToPluralize: string[] = [];
        let newExpandedUserFields: string[] = [];

        Object.entries(currTemplate.properties.properties).forEach(([key, _value]) => {
            const newValue = updatedTemplateData.properties.properties[key];
            if ((!newValue || newValue?.isNewPropNameEqualDeletedPropName) && !currTemplate.actions) removedProperties.push(key);
        });

        const newProperties = Object.keys(updatedTemplateData.properties.properties).filter(
            (property) => !currProperties.properties[property] && !removedProperties.includes(property),
        );

        if (count > 0) {
            if (updatedTemplateData.name !== currTemplate.name) throw new BadRequestError('can not change template name');

            Object.entries(currTemplate.properties.properties).forEach(([key, value]) => {
                const newValue = updatedTemplateData.properties.properties[key];
                if ((newValue && !newValue?.isNewPropNameEqualDeletedPropName) || currTemplate.actions) {
                    const isSingularToPlural =
                        (value.format === 'fileId' && newValue.items?.format === 'fileId') || (value.enum && newValue.items?.enum);

                    if (value.serialCurrent !== undefined) updatedTemplateData.properties.properties[key].serialCurrent = value.serialCurrent;
                    if (
                        !currUnique.some((uniqueConstraint) => uniqueConstraint.properties.includes(key)) &&
                        updatedTemplateData.uniqueConstraints.some((uniqueConstraint) => uniqueConstraint.properties.includes(key))
                    )
                        throw new BadRequestError('can`t add unique constraints to property that already used');

                    if (value.type !== newValue.type && !isSingularToPlural) throw new BadRequestError('can not change property type');

                    if (
                        !(
                            (value.format === 'text-area' && !newValue.format && newValue.type === 'string') ||
                            (!value.format && value.type === 'string' && newValue.format === 'text-area') ||
                            value.format === newValue.format ||
                            isSingularToPlural
                        )
                    ) {
                        throw new BadRequestError('can not change property format', { value, newValue });
                    }
                    if (value.enum && newValue.enum && !value.enum?.every((val) => newValue.enum?.includes(val)))
                        throw new BadRequestError('can not remove options from enum');
                    if (value.serialStarter !== newValue.serialStarter) throw new BadRequestError('can not change property serial starter');
                    if (
                        value.relationshipReference &&
                        !isEqual(omit(value.relationshipReference, 'filters'), omit(newValue.relationshipReference, 'filters'))
                    )
                        throw new BadRequestError('can not change relationship reference fields');
                    if (!value.archive && newValue.archive && !currTemplate.actions) archiveProperties.push(key);
                    if (isSingularToPlural) propertiesKeysToPluralize.push(key);
                }
            });

            newExpandedUserFields = newProperties.filter((property) => {
                return updatedTemplateData.properties.properties[property].format === 'kartoffelUserField';
            });

            const updatedProperties = updatedTemplateData.properties.properties;
            if (newProperties.some((property) => updatedProperties[property].identifier && updatedProperties[property].serialStarter === undefined))
                throw new BadRequestError('can not add identifier fields because there are existing instances');
        }

        await this.checkIfPropertyInUsedBeforeDeleteOrArchive(currTemplate, removedProperties, false, userId);
        await this.checkIfPropertyInUsedBeforeDeleteOrArchive(currTemplate, archiveProperties, true, userId);

        const { iconFileId, documentTemplatesIds } = await this.handleFiles(updatedTemplateData, currTemplate, { file, files });

        const { uniqueConstraints, properties, ...restOfTemplateData } = await this.updateNewSerialNumberFields(
            id,
            updatedTemplateData,
            currTemplate,
        ).catch((error) => {
            throw new BadRequestError(`Failed to create serial number fields for existing entities: ${error}`);
        });

        const { required: requiredConstraints, ...restOfTemplatePropertiesObject } = properties;

        Object.keys(restOfTemplatePropertiesObject.properties).forEach((key) => {
            delete restOfTemplatePropertiesObject.properties[key].isNewPropNameEqualDeletedPropName;
        });

        const updatedTemplate = await this.entityTemplateService.updateEntityTemplate(id, {
            ...restOfTemplateData,
            properties: restOfTemplatePropertiesObject,
            iconFileId,
            documentTemplatesIds,
        });

        await this.deletePropertyOfEntityTemplate(id, count, removedProperties, currTemplate);

        if (newExpandedUserFields.length) await this.updateInstancesWithUserFields(id, newExpandedUserFields, updatedTemplateData, userId);

        try {
            if (propertiesKeysToPluralize.length > 0) await this.instancesService.convertFieldsToPlural(id, propertiesKeysToPluralize);
        } catch (error) {
            logger.error('Neo4j update failed: starting roll-back', { error });
            const restOfEntityTemplate: Omit<IEntityTemplatePopulated, 'disabled' | '_createdAt' | '_updatedAt' | '_id'> =
                this.removeBasicFields(currTemplate);
            await this.handleTemplateConversionRollback(id, restOfEntityTemplate);
            throw new ServiceError(internalServerErrorStatus, 'Neo4j update failed: starting roll-back', { error });
        }

        await this.instancesService.updateConstraintsOfTemplate(id, {
            uniqueConstraints,
            requiredConstraints,
        });
        if (updatedTemplate.category._id !== currTemplate.category._id)
            await this.updateEntityTemplateScope(updatedTemplate, permissionsOfUserId, userId);

        const updatedChildTemplates = await updateChildTemplatesOnParentUpdate(
            this.entityTemplateService,
            id,
            removedProperties,
            updatedTemplateData.properties.required,
            required,
        );

        const template = this.populateTemplateConstraints(updatedTemplate, requiredConstraints, uniqueConstraints);

        return {
            template,
            childTemplates: updatedChildTemplates.map((updatedChildTemplate) =>
                this.populateTemplateConstraints(
                    {
                        ...updatedChildTemplate,
                        parentTemplate: { ...template, category: template.category._id },
                    },
                    requiredConstraints,
                    uniqueConstraints,
                ),
            ),
        };
    }

    async updateChildTemplate(
        id: string,
        userId: string,
        updatedTemplateData: IChildTemplate,
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ): Promise<IChildTemplateWithConstraintsPopulated> {
        const {
            parentTemplateId,
            category,
            properties: { properties },
        } = updatedTemplateData;

        await this.entityTemplateService.getCategoryById(category);
        await this.entityTemplateService.getEntityTemplateById(parentTemplateId);

        const { uniqueConstraints, requiredConstraints } = await this.instancesService.getConstraintsOfTemplate(parentTemplateId);

        const currTemplate = await this.entityTemplateService.getChildTemplateById(id);
        if (currTemplate.disabled === true) throw new BadRequestError('can not update disabled template');

        const requiredNotInProperties = requiredConstraints.find((requiredKey) => !Object.keys(properties).includes(requiredKey));
        if (requiredNotInProperties) throw new ValidationError(`required key ${requiredNotInProperties} isn't in properties`);

        const updatedChildTemplate = await this.entityTemplateService.updateChildTemplate(id, updatedTemplateData);
        const { parentTemplate, ...updatedChild } = updatedChildTemplate;

        if (updatedChild.category._id !== currTemplate.category._id)
            await this.updateEntityTemplateScope(updatedChildTemplate, permissionsOfUserId, userId);

        const { uniqueConstraints: currUnique, requiredConstraints: currRequired } =
            await this.instancesService.getConstraintsOfTemplate(parentTemplateId);

        const parentWithConstraints = this.populateTemplateConstraints(parentTemplate, currRequired, currUnique);

        return this.populateTemplateConstraints({ ...updatedChild, parentTemplate: parentWithConstraints }, requiredConstraints, uniqueConstraints);
    }

    async getChildTemplateById(id: string) {
        return this.entityTemplateService.getChildTemplateById(id);
    }

    private checkValidAmountOfArchiveProperties(updatedTemplateProperties: Record<string, IEntitySingleProperty>) {
        const archivePropertiesNumber = Object.values(updatedTemplateProperties).reduce((count, { archive }) => (archive ? count + 1 : count), 0);

        return archivePropertiesNumber < Object.values(updatedTemplateProperties).length;
    }

    async updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        const updatedEntityTemplate = await this.entityTemplateService.updateEntityTemplateStatus(id, disabledStatus);
        const updatedChildTemplates = !disabledStatus
            ? []
            : await this.entityTemplateService.multiUpdateChildTemplateStatusByParentId(id, disabledStatus);

        const allConstraints = await this.instancesService.getAllConstraints();
        const constraintsOfTemplate = allConstraints.filter(({ templateId }) => templateId === updatedEntityTemplate._id);

        const { requiredConstraints, uniqueConstraints } = constraintsOfTemplate.reduce(
            (acc, constraint) => {
                acc.requiredConstraints.push(...constraint.requiredConstraints);
                acc.uniqueConstraints.push(...constraint.uniqueConstraints);

                return acc;
            },
            { requiredConstraints: [] as string[], uniqueConstraints: [] as IUniqueConstraintOfTemplate[] },
        );

        return {
            entityTemplate: this.populateTemplateConstraints(updatedEntityTemplate, requiredConstraints ?? [], uniqueConstraints ?? []),
            childTemplates: updatedChildTemplates.map((childTemplate) => {
                return this.populateTemplateConstraints(childTemplate, requiredConstraints ?? [], uniqueConstraints ?? []);
            }),
        };
    }

    removeBasicFields(template: IMongoEntityTemplatePopulated) {
        const { createdAt: _createdAt, updatedAt: _updatedAt, _id, disabled: _disabled, ...rest } = template;
        Object.entries(template.properties.properties).forEach(([_name, value]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'string') {
                value.relationshipReference.filters = JSON.parse(value.relationshipReference.filters);
            }
        });

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
        else templateEnumFieldValues = templateEnumFieldValues.filter((_value, index) => valueIndex !== index);
        const templateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled' | '_id'> = this.removeBasicFields(template);
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
        if (items?.enum) {
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
            template.properties.properties[values.name].enum = templateEnumFieldValuesRB;
        const rollBackTemplateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled' | '_id'> = this.removeBasicFields(template);
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

    async handleTemplateConversionRollback(
        entityTemplateId: string,
        rollBackTemplateWithoutProperties: Omit<IEntityTemplatePopulated, 'disabled' | '_createdAt' | '_updatedAt' | '_id'>,
        currentRelationshipTemplate?: IMongoRelationshipTemplate,
        allowToDeleteRelationshipFields: boolean = true,
    ) {
        try {
            if (currentRelationshipTemplate) {
                const { createdAt: _createdAt, updatedAt: _updatedAt, _id, ...restRelationshipTemplate } = currentRelationshipTemplate;
                await this.relationshipTemplateService.updateRelationshipTemplate(_id, restRelationshipTemplate);
            }

            await this.entityTemplateService.updateEntityTemplate(
                entityTemplateId,
                {
                    ...rollBackTemplateWithoutProperties,
                    category: rollBackTemplateWithoutProperties.category._id,
                },
                allowToDeleteRelationshipFields,
            );

            logger.info('RollBack mongoDB succeeded');
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
            // biome-ignore lint/suspicious/noExplicitAny: error is any
        } catch (neoError: any) {
            if (neoError.response?.status === notFoundStatus) throw new NotFoundError('Neo4j update failed: Node not found', { error: neoError });

            logger.error('Neo4j update failed: starting roll-back', { error: neoError });
            await this.neoRollBack(id, values, index, templateWithoutProperties, fieldValue, template, field);

            throw new ServiceError(internalServerErrorStatus, 'Neo4j update failed: starting roll-back', { error: neoError });
        }

        const { requiredConstraints, uniqueConstraints } = await this.instancesService.getConstraintsOfTemplate(id);
        return this.populateTemplateConstraints(templateWithoutProperties, requiredConstraints, uniqueConstraints);
    }

    private async checkFieldValueUsage(id: string, fieldValue: string, fieldName: string, fieldType: string): Promise<void> {
        const data = await this.instancesService.getIfValueFieldIsUsed(id, fieldValue, fieldName, fieldType);
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
        const { err: getEntityErr } = await tryCatch(() => this.entityTemplateService.getEntityTemplateById(entityTemplateId));
        if (getEntityErr) {
            const { response } = getEntityErr as AxiosError;

            if (response?.status === notFoundStatus) throw new BadRequestError(errorMessage);

            throw getEntityErr;
        }
    }

    async createRelationshipTemplate(relationshipTemplate: IMongoRelationshipTemplate) {
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        await this.throwIfEntityTemplateDoesntExist(sourceEntityId, 'source entity of relation doesnt exist');
        await this.throwIfEntityTemplateDoesntExist(destinationEntityId, 'destination entity of relation doesnt exist');

        const { disabled: sourceEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(sourceEntityId);
        const { disabled: destinationEntityDisabled } = await this.entityTemplateService.getEntityTemplateById(destinationEntityId);

        if (sourceEntityDisabled === true || destinationEntityDisabled === true)
            throw new BadRequestError('can not create relationship template with disabled entity');

        return this.relationshipTemplateService.createRelationshipTemplate(relationshipTemplate);
    }

    async updateRelationshipTemplate(templateId: string, updatedFields: Partial<IMongoRelationshipTemplate>) {
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

        const restOfEntityTemplate: Omit<IEntityTemplatePopulated, 'disabled' | '_createdAt' | '_updatedAt' | '_id'> = this.removeBasicFields(
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
            await this.handleTemplateConversionRollback(entityIdToUpdate, restOfEntityTemplate, currentRelationshipTemplate, false);
            throw new ServiceError(internalServerErrorStatus, 'Neo4j update failed: starting roll-back', { error });
        }
        return { updatedRelationShipTemplate, updatedEntityTemplate };
    }

    // entities
    async getAllowedEntitiesTemplates(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        userId: string,
        searchBody?: ISearchEntityTemplatesBody,
    ) {
        const updatedSearchBody: ISearchEntityTemplatesBody = { ...searchBody };

        if (!userPermissions.admin && !userPermissions.templates && userPermissions.instances) {
            updatedSearchBody.categoryIds = Object.keys(userPermissions.instances.categories);
        }

        return this.entityTemplateService.searchEntityTemplates(userId, updatedSearchBody);
    }

    // child entity templates
    async getAllowedChildEntitiesTemplates(userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId']) {
        if (!userPermissions?.admin && !userPermissions?.instances) return [];

        const allChildTemplates = await this.entityTemplateService.searchChildTemplates({});

        if (userPermissions?.admin) return allChildTemplates;

        const ids: string[] = [];
        const allChildTemplateIds = new Set(Object.values(allChildTemplates).map((childTemplate) => childTemplate._id));

        for (const [categoryId, category] of Object.entries(userPermissions?.instances?.categories ?? {})) {
            const entityTemplateIds = Object.keys(category?.entityTemplates ?? {});
            if (category.scope) {
                const templatesInCategory = Object.values(allChildTemplates)
                    .filter((template) => template.category._id === categoryId)
                    .map((template) => template._id);

                ids.push(...templatesInCategory);
            } else if (entityTemplateIds.length > 0) {
                const filtered = entityTemplateIds.filter((id) => allChildTemplateIds.has(id));
                ids.push(...filtered);
            }
        }

        return this.entityTemplateService.searchChildTemplates({ ids });
    }

    async updateChildTemplateStatus(id: string, disabledStatus: boolean) {
        const updatedChildTemplate = await this.entityTemplateService.updateChildTemplateStatus(id, disabledStatus);

        const allConstraints = await this.instancesService.getAllConstraints();
        const constraintsOfTemplate = allConstraints.filter(({ templateId }) => templateId === updatedChildTemplate._id);

        const { requiredConstraints, uniqueConstraints } = constraintsOfTemplate.reduce(
            (acc, constraint) => {
                acc.requiredConstraints.push(...constraint.requiredConstraints);
                acc.uniqueConstraints.push(...constraint.uniqueConstraints);

                return acc;
            },
            { requiredConstraints: [] as string[], uniqueConstraints: [] as IUniqueConstraintOfTemplate[] },
        );

        return this.populateTemplateConstraints(updatedChildTemplate, requiredConstraints, uniqueConstraints);
    }

    async updateChildTemplateById(templateId: string, childTemplate: IChildTemplate) {
        const updatedChild = await this.entityTemplateService.updateChildTemplate(templateId, childTemplate);
        if (!updatedChild) throw new BadRequestError('Failed to updated child');

        const { requiredConstraints } = await this.instancesService.getConstraintsOfTemplate(childTemplate.parentTemplateId);

        const requiredNotInProperties = requiredConstraints.find(
            (requiredKey) => !Object.keys(childTemplate.properties.properties).includes(requiredKey),
        );
        if (requiredNotInProperties) throw new ValidationError(`required key ${requiredNotInProperties} isn't in properties`);

        const [childTemplatePopulatedWithConstraints] = await this.getAndPopulateAllTemplatesConstraints([updatedChild]);
        return childTemplatePopulatedWithConstraints;
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

    async getManyRulesByIds(rulesIds: string[], permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], userId: string) {
        const allowedEntityTemplatesIds = await this.getAllowedEntityTemplateIds(permissionsOfUserId, userId);
        const rules = await this.relationshipTemplateService.getManyRulesByIds(rulesIds);
        return rules.filter((rule) => allowedEntityTemplatesIds.includes(rule.entityTemplateId));
    }

    // Printing Templates
    async createPrintingTemplate(data: IPrintingTemplate) {
        return this.printingTemplateService.createPrintingTemplate(data);
    }

    async getPrintingTemplateById(id: string) {
        return this.printingTemplateService.getPrintingTemplateById(id);
    }

    async getAllPrintingTemplates() {
        return this.printingTemplateService.getAllPrintingTemplates();
    }

    async updatePrintingTemplate(id: string, data: IPrintingTemplate) {
        return this.printingTemplateService.updatePrintingTemplate(id, data);
    }

    async deletePrintingTemplate(id: string) {
        return this.printingTemplateService.deletePrintingTemplate(id);
    }

    async searchPrintingTemplates(searchBody: ISearchEntityTemplatesBody) {
        return this.printingTemplateService.searchPrintingTemplates(searchBody);
    }
}

export default TemplatesManager;
