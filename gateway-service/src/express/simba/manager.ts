import {
    IBrokenRule,
    IEntity,
    IMongoEntityTemplatePopulated,
    ISearchEntitiesOfTemplateBody,
    NotFoundError,
    UploadedFile,
} from '@microservices/shared';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import InstancesService from '../../externalServices/instanceService';
import DefaultManagerProxy from '../../utils/express/manager';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import TemplatesManager from '../templates/manager';
import InstanceManager from '../instances/manager';

class SimbaManager extends DefaultManagerProxy<null> {
    private entityTemplateService: EntityTemplateService;

    private instanceManager: InstanceManager;

    private templatesManager: TemplatesManager;

    private relationshipTemplateService: RelationshipsTemplateService;

    private instancesService: InstancesService;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
        this.templatesManager = new TemplatesManager(workspaceId);
        this.instanceManager = new InstanceManager(workspaceId);
    }

    async getAllSimbaTemplates(usersInfoChildTemplateId: string) {
        const childTemplates = await this.entityTemplateService.getAllChildTemplates();

        const usersInfoChildTemplate = childTemplates.find((template) => template._id === usersInfoChildTemplateId);

        if (!usersInfoChildTemplate) {
            throw new NotFoundError('Users info child template not found');
        }

        const categories = [...new Set(childTemplates.map((childTemplate) => childTemplate.categories).flat())];
        const entityTemplates = [...new Set(childTemplates.map((childTemplate) => childTemplate.fatherTemplateId))].map((entityTemplate) => ({
            ...entityTemplate,
            category: categories.find((category) => category._id === entityTemplate.category) || entityTemplate.category,
        })) as IMongoEntityTemplatePopulated[];

        const populatedEntityTemplates = await this.templatesManager.getAndPopulateAllTemplatesConstraints(entityTemplates);

        const [bySource, byDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: [usersInfoChildTemplate.fatherTemplateId._id] }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: [usersInfoChildTemplate.fatherTemplateId._id] }),
        ]);
        const relationshipTemplates = [...bySource, ...byDestination];

        return {
            entityTemplates: populatedEntityTemplates,
            relationshipTemplates,
            childTemplates,
            categories,
        };
    }

    async getInstancesByTemplateId(templateId: string, kartoffelId: string) {
        const instances = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, {
            skip: 0,
            limit: 1,
            filter: { $and: [{ disabled: { $in: [false] } }, { full_name: { $eq: kartoffelId } }] },
            showRelationships: true,
            sort: [],
        });
        return instances;
    }

    async getExpandedEntityById(entityId: string, expandedParams: { [key: string]: number }, options?: { templateIds: string[] }, userId?: string) {
        const expandedEntity = await this.instancesService.getExpandedEntityByIdRequest(
            entityId,
            expandedParams,
            {
                templateIds: options?.templateIds ?? [],
            },
            userId,
        );

        return expandedEntity;
    }

    async countEntitiesOfTemplatesByUserEntityId(templateIds: string[], userEntityId: string) {
        const count = await this.instancesService.countEntitiesOfTemplatesByUserEntityId(templateIds, userEntityId);
        return count;
    }

    async searchEntitiesOfTemplate(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const entities = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, searchBody);
        return entities;
    }

    async createEntity(entity: IEntity, files: UploadedFile[], ignoredRules: IBrokenRule[], userId: string) {
        const createdEntity = await this.instanceManager.createEntityInstance(entity, files, ignoredRules, userId);
        return createdEntity;
    }
}

export default SimbaManager;
