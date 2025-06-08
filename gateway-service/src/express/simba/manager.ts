import { ISearchEntitiesOfTemplateBody, NotFoundError } from '@microservices/shared';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import InstancesService from '../../externalServices/instanceService';
import DefaultManagerProxy from '../../utils/express/manager';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';

class SimbaManager extends DefaultManagerProxy<null> {
    private entityTemplateService: EntityTemplateService;

    private relationshipTemplateService: RelationshipsTemplateService;

    private instancesService: InstancesService;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipTemplateService = new RelationshipsTemplateService(workspaceId);
    }

    async getAllSimbaTemplates(usersInfoChildTemplateId: string) {
        const childTemplates = await this.entityTemplateService.getAllChildTemplates();

        const usersInfoChildTemplate = childTemplates.find((template) => template._id === usersInfoChildTemplateId);

        if (!usersInfoChildTemplate) {
            throw new NotFoundError('Users info child template not found');
        }

        const entityTemplates = [...new Set(childTemplates.map((childTemplate) => childTemplate.fatherTemplateId))];
        const categories = [...new Set(childTemplates.map((childTemplate) => childTemplate.categories).flat())];

        const [bySource, byDestination] = await Promise.all([
            this.relationshipTemplateService.searchRelationshipTemplates({ sourceEntityIds: [usersInfoChildTemplate.fatherTemplateId._id] }),
            this.relationshipTemplateService.searchRelationshipTemplates({ destinationEntityIds: [usersInfoChildTemplate.fatherTemplateId._id] }),
        ]);
        const relationshipTemplates = [...bySource, ...byDestination];

        return {
            entityTemplates,
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

    async countEntitiesOfTemplatesByUserEntityId(templateIds: string[], userEntityId: string) {
        const count = await this.instancesService.countEntitiesOfTemplatesByUserEntityId(templateIds, userEntityId);
        return count;
    }

    async searchEntitiesOfTemplate(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const entities = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, searchBody);
        return entities;
    }
}

export default SimbaManager;
