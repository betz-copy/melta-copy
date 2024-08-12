import { Request } from 'express';
import { GanttsService, IGantt } from '../../externalServices/ganttsService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import DefaultController from '../../utils/express/controller';
import { ServiceError } from '../error';
import { InstancesValidator } from '../instances/middlewares';

export class GanttsValidator extends DefaultController {
    private ganttsService: GanttsService;

    private instancesValidator: InstancesValidator;

    constructor(private workspaceId: string) {
        super(null);
        this.ganttsService = new GanttsService(workspaceId);
        this.instancesValidator = new InstancesValidator(workspaceId);
    }

    private async validateHasPermissionsToGanttItems(gantt: IGantt, allowedEntityTemplateIds: string[]) {
        const unauthorizedTemplates = gantt.items
            .map(({ entityTemplate: { id } }) => id)
            .filter((templateId) => !allowedEntityTemplateIds.includes(templateId));

        if (unauthorizedTemplates.length > 0) {
            throw new ServiceError(403, 'user not authorized', {
                metadata: `unauthorized gantt items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
            });
        }
    }

    async validateUserHasPermissionsToGantt(userId: string, newGantt: IGantt | undefined, existingGanttId: string | undefined) {
        const userPermissions = await UserService.getUserPermissions(userId);

        if (userPermissions[this.workspaceId].templates?.scope !== PermissionScope.write) {
            throw new ServiceError(403, 'user not authorized', { metadata: `user is not templates manager to create/update/delete gantts` });
        }

        const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(userPermissions[this.workspaceId]);
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
        await this.validateUserHasPermissionsToGantt(req.user!.id, req.body, undefined);
    }

    async validateUserCanUpdateGantt(req: Request) {
        await this.validateUserHasPermissionsToGantt(req.user!.id, req.body, req.params.ganttId);
    }

    async validateUserCanDeleteGantt(req: Request) {
        await this.validateUserHasPermissionsToGantt(req.user!.id, undefined, req.params.ganttId);
    }
}
