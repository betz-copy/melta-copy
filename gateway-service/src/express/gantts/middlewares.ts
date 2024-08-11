import { Request } from 'express';
import { IGantt, GanttsService } from '../../externalServices/ganttsService';
import { ForbiddenError } from '../error';
import { getAllowedEntityTemplatesForInstances } from '../instances/middlewares';
import PermissionsManager from '../permissions/manager';

const validateHasPermissionsToGanttItems = async (gantt: IGantt, allowedEntityTemplateIds: string[]) => {
    const unauthorizedTemplates = gantt.items
        .map(({ entityTemplate: { id } }) => id)
        .filter((templateId) => !allowedEntityTemplateIds.includes(templateId));

    if (unauthorizedTemplates.length > 0) {
        throw new ForbiddenError('user not authorized', {
            metadata: `unauthorized gantt items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
        });
    }
};

export const validateUserHasPermissionsToGantt = async (userId: string, newGantt: IGantt | undefined, existingGanttId: string | undefined) => {
    const userPermissions = await PermissionsManager.getPermissionsOfUserId(userId);

    if (!userPermissions.templatesManagementId) {
        throw new ForbiddenError('user not authorized', { metadata: `user is not templates manager to create/update/delete gantts` });
    }

    const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(userPermissions);
    const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

    if (newGantt) {
        await validateHasPermissionsToGanttItems(newGantt, allowedEntityTemplateIds);
    }
    if (existingGanttId) {
        const existingGantt = await GanttsService.getGanttById(existingGanttId);
        await validateHasPermissionsToGanttItems(existingGantt, allowedEntityTemplateIds);
    }
};

export const validateUserCanCreateGantt = async (req: Request) => {
    await validateUserHasPermissionsToGantt(req.user!.id, req.body, undefined);
};

export const validateUserCanUpdateGantt = async (req: Request) => {
    await validateUserHasPermissionsToGantt(req.user!.id, req.body, req.params.ganttId);
};

export const validateUserCanDeleteGantt = async (req: Request) => {
    await validateUserHasPermissionsToGantt(req.user!.id, undefined, req.params.ganttId);
};
