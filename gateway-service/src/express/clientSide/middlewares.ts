import { Request } from 'express';
import config from '../../config';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import DefaultController from '../../utils/express/controller';

class ClientSideValidator extends DefaultController {
    private workspaceId: string;

    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    constructor(workspaceId: string) {
        super(null);
        this.workspaceId = workspaceId;

        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(this.workspaceId);
    }

    async validateUserCanAccessClientSide(req: Request) {
        const { user } = req;

        if (!user || !user.kartoffelId || !user.clientSide) throw new Error('Non existing user trying connecting to client side');

        const usersInfoChildTemplate = await this.entityTemplateService.getChildTemplateById(user.clientSide.usersInfoChildTemplateId);

        const usersInfoTemplateId = usersInfoChildTemplate.parentTemplate._id;

        if (!usersInfoTemplateId) throw new Error("Can't find users template by child ");

        const instances = await this.instancesService.searchEntitiesOfTemplateRequest(usersInfoTemplateId, {
            skip: 0,
            limit: 1,
            filter: { $and: [{ disabled: { $in: [false] } }, { [config.clientSide.fullNameField]: { $eq: user.kartoffelId } }] },
            showRelationships: true,
            sort: [],
        });

        const clientSideUserEntity = instances.entities[0];

        if (!clientSideUserEntity) throw new Error('User does not exists in client side drivers table');

        req.user = user;

        req.clientSideUserEntity = clientSideUserEntity;
    }
}

export default ClientSideValidator;
