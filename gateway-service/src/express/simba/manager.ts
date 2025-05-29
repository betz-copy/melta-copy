import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import InstancesService from '../../externalServices/instanceService';
import DefaultManagerProxy from '../../utils/express/manager';

class SimbaManager extends DefaultManagerProxy<null> {
    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    constructor(workspaceId: string) {
        super(null);

        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
    }

    async getAllTemplates() {
        const templates = await this.entityTemplateService.getAllChildTemplates();
        return templates;
    }

    async getInstancesByTemplateId(templateId: string, kartoffelId: string) {
        const instances = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, {
            skip: 0,
            limit: 1,
            filter: { $and: [{ disabled: { $in: [false] } }, { full_name: { $eq: kartoffelId } }] },
            showRelationships: false,
            sort: [],
        });
        return instances;
    }

    async getEntityChildTemplateById(templateId: string) {
        const entityChildTemplate = await this.entityTemplateService.getChildTemplateById(templateId);
        return entityChildTemplate;
    }
}

export default SimbaManager;
