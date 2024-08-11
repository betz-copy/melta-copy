import { Request } from 'express';
import { IGantt, GanttsService } from '../../externalServices/ganttsService';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { getWorkspaceId } from '../../utils/express';
import { ServiceError } from '../error';
import { getAllowedEntityTemplatesForInstances } from '../instances/middlewares';

const validateHasPermissionsToGanttItems = async (gantt: IGantt, allowedEntityTemplateIds: string[]) => {
    const unauthorizedTemplates = gantt.items
        .map(({ entityTemplate: { id } }) => id)
        .filter((templateId) => !allowedEntityTemplateIds.includes(templateId));

    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', {
            metadata: `unauthorized gantt items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
        });
    }
};

export const validateUserHasPermissionsToGantt = async (
    workspaceId: string,
    entityTemplateService: EntityTemplateService,
    ganttsService: GanttsService,
    userId: string,
    newGantt: IGantt | undefined,
    existingGanttId: string | undefined,
) => {
    const userPermissions = await UserService.getUserPermissions(userId);

    if (userPermissions[workspaceId].templates?.scope !== PermissionScope.write) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user is not templates manager to create/update/delete gantts` });
    }

    const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(entityTemplateService, userPermissions[workspaceId]);
    const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

    if (newGantt) {
        await validateHasPermissionsToGanttItems(newGantt, allowedEntityTemplateIds);
    }
    if (existingGanttId) {
        const existingGantt = await ganttsService.getGanttById(existingGanttId);
        await validateHasPermissionsToGanttItems(existingGantt, allowedEntityTemplateIds);
    }
};

export const validateUserCanCreateGantt = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const entityTemplateService = new EntityTemplateService(workspaceId);
    const ganttsService = new GanttsService(workspaceId);

    await validateUserHasPermissionsToGantt(workspaceId, entityTemplateService, ganttsService, req.user!.id, req.body, undefined);
};

export const validateUserCanUpdateGantt = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const entityTemplateService = new EntityTemplateService(workspaceId);
    const ganttsService = new GanttsService(workspaceId);

    await validateUserHasPermissionsToGantt(workspaceId, entityTemplateService, ganttsService, req.user!.id, req.body, req.params.ganttId);
};

export const validateUserCanDeleteGantt = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const entityTemplateService = new EntityTemplateService(workspaceId);
    const ganttsService = new GanttsService(workspaceId);

    await validateUserHasPermissionsToGantt(workspaceId, entityTemplateService, ganttsService, req.user!.id, undefined, req.params.ganttId);
};
