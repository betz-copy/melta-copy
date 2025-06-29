/* eslint-disable no-console */
import { Request } from 'express';
import DefaultController from '../../utils/express/controller';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';

class SimbaValidator extends DefaultController {
    private workspaceId: string;

    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    constructor(workspaceId: string) {
        super(null);
        this.workspaceId = workspaceId;

        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(this.workspaceId);
    }

    async validateUserCanAccessSimba(req: Request) {
        const { user } = req;

        if (!user || !user.kartoffelId || !user.usersInfoChildTemplateId) throw new Error('Non existing user trying connecting to simba');

        const usersInfoChildTemplate = await this.entityTemplateService.getChildTemplateById(user.usersInfoChildTemplateId);

        const usersInfoTemplateId = usersInfoChildTemplate.fatherTemplateId._id;

        if (!usersInfoTemplateId) throw new Error("Can't find users template by child ");

        const instances = await this.instancesService.searchEntitiesOfTemplateRequest(usersInfoTemplateId, {
            skip: 0,
            limit: 1,
            filter: { $and: [{ disabled: { $in: [false] } }, { full_name: { $eq: user.kartoffelId } }] },
            showRelationships: true,
            sort: [],
        });

        const simbaUserEntity = instances.entities[0];

        if (!simbaUserEntity) throw new Error('User does not exists in simba drivers table');

        req.user = { ...user, id: `simba-${user.kartoffelId}` };

        req.simbaUserEntity = simbaUserEntity;
    }
}

export default SimbaValidator;
