import { Request } from 'express';
import { ForbiddenError, IGantt } from '@microservices/shared';
import GanttsService from '../../externalServices/ganttsService';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import InstancesValidator from '../instances/middlewares';

class GanttsValidator extends DefaultController {
    private ganttsService: GanttsService;

    private instancesValidator: InstancesValidator;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.ganttsService = new GanttsService(workspaceId);
        this.instancesValidator = new InstancesValidator(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
    }

    private async validateHasPermissionsToGanttItems(gantt: IGantt, allowedEntityTemplateIds: string[]) {
        const unauthorizedTemplates = gantt.items
            .map(({ entityTemplate: { id } }) => id)
            .filter((templateId) => !allowedEntityTemplateIds.includes(templateId));

        if (unauthorizedTemplates.length > 0) {
            throw new ForbiddenError('user not authorized', {
                metadata: `unauthorized gantt items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
            });
        }
    }

    async validateUserHasPermissionsToGantt(req: Request, newGantt: IGantt | undefined, existingGanttId: string | undefined) {
        const [userPermissions] = await Promise.all([
            this.authorizer.getWorkspacePermissions(req.user!.id),
            this.authorizer.userCanWriteTemplates(req),
        ]);

        const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(userPermissions, req.user!.id);
        const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        if (newGantt) {
            await this.validateHasPermissionsToGanttItems(newGantt, allowedEntityTemplateIds);
        }
        if (existingGanttId) {
            const existingGantt = await this.ganttsService.getGanttById(existingGanttId);
            await this.validateHasPermissionsToGanttItems(existingGantt, allowedEntityTemplateIds);
        }
    }

    async validateUserCanCreateGantt(req: Request) {
        await this.validateUserHasPermissionsToGantt(req, req.body, undefined);
    }

    async validateUserCanUpdateGantt(req: Request) {
        await this.validateUserHasPermissionsToGantt(req, req.body, req.params.ganttId);
    }

    async validateUserCanDeleteGantt(req: Request) {
        await this.validateUserHasPermissionsToGantt(req, undefined, req.params.ganttId);
    }
}

export default GanttsValidator;
