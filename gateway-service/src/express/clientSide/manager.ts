import {
    IBrokenRule,
    IEntity,
    IMongoEntityTemplatePopulated,
    ISearchEntitiesOfTemplateBody,
    NotFoundError,
    UploadedFile,
} from '@microservices/shared';
import config from '../../config';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import DefaultManagerProxy from '../../utils/express/manager';
import InstanceManager from '../instances/manager';
import NotificationsService from '../notifications/manager';
import TemplatesManager from '../templates/manager';

class ClientSideManager extends DefaultManagerProxy<null> {
    private entityTemplateService: EntityTemplateService;

    private instanceManager: InstanceManager;

    private templatesManager: TemplatesManager;

    private relationshipTemplateService: RelationshipsTemplateService;

    private instancesService: InstancesService;

    private notificationsService: NotificationsService;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
        this.templatesManager = new TemplatesManager(workspaceId);
        this.instanceManager = new InstanceManager(workspaceId);
        this.notificationsService = new NotificationsService(workspaceId);
    }

    async getAllClientSideTemplates(usersInfoChildTemplateId: string) {
        const childTemplates = await this.entityTemplateService.getAllChildTemplates();

        const usersInfoChildTemplate = childTemplates.find((template) => template._id === usersInfoChildTemplateId);

        if (!usersInfoChildTemplate) throw new NotFoundError('Users info child template not found');

        const categories = [...new Set(childTemplates.map((childTemplate) => childTemplate.category))];
        const entityTemplates = [...new Set(childTemplates.map((childTemplate) => childTemplate.parentTemplate))].map((entityTemplate) => ({
            ...entityTemplate,
            category: categories.find((category) => category._id === entityTemplate.category) || entityTemplate.category,
        })) as IMongoEntityTemplatePopulated[];

        const populatedEntityTemplates = await this.templatesManager.getAndPopulateAllTemplatesConstraints(entityTemplates);

        const [bySource, byDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: [usersInfoChildTemplate.parentTemplate._id] }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: [usersInfoChildTemplate.parentTemplate._id] }),
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
            filter: { $and: [{ disabled: { $in: [false] } }, { [config.clientSide.fullNameField]: { $eq: kartoffelId } }] },
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

    async getMyNotifications(user: Express.User, query: any) {
        const notifications = await this.notificationsService.getMyNotifications(user, query);
        return notifications;
    }

    async getMyNotificationGroupCount(user: Express.User, query: any) {
        const notificationGroupCount = await this.notificationsService.getMyNotificationGroupCount(user, query);
        return notificationGroupCount;
    }

    async manyNotificationSeen(user: Express.User, query: any) {
        const notifications = await this.notificationsService.manyNotificationsSeen(user, query);
        return notifications;
    }
}

export default ClientSideManager;
