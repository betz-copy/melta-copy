import { Request } from 'express';
import { IFrame } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import PermissionsManager from '../permissions/manager';
import IFrameManager from './manager';
import { IPermissionsOfUser } from '../permissions/interfaces';
import DefaultController from '../../utils/express/controller';

export class IFramesValidator extends DefaultController {
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
            throw new ServiceError(403, 'user not authorized', {
                metadata: `unauthorized gantt items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
            });
        }
    }

    async validateUserHasPermissionsToGantt(req: Request, newGantt: IGantt | undefined, existingGanttId: string | undefined) {
        const [userPermissions] = await Promise.all([
            this.authorizer.getWorkspacePermissions(req.user!.id),
            this.authorizer.userCanWriteTemplates(req),
        ]);

        const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(userPermissions);
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

// const validateHasPermissionsToIFrame = async (iFrame: IFrame, allowedCategoriesIds: string[]) => {
//     const unauthorizedCategories = iFrame.categoryIds.filter((id) => !allowedCategoriesIds.includes(id));

//     if (unauthorizedCategories.length > 0) {
//         throw new ServiceError(403, 'user not authorized ', {
//             metadata: `unauthorized iFrame items' categories ${JSON.stringify(unauthorizedCategories)}`,
//         });
//     }
// };

// export const getAllowedCategories = (userPermissions: Omit<IPermissionsOfUser, 'user'>) => {
//     return userPermissions.instancesPermissions.filter((permission) => permission.scopes.includes('Read')).map((permission) => permission.category);
// };

// export const validateUserHasPermissionsToIFrame = async (userId: string, newIFrame: IFrame | undefined, existingIFrameId: string | undefined) => {
//     const userPermissions = await PermissionsManager.getPermissionsOfUserId(userId);

//     const allowedCategoriesIds: string[] = getAllowedCategories(userPermissions);

//     if (newIFrame) {
//         await validateHasPermissionsToIFrame(newIFrame, allowedCategoriesIds);
//     }
//     if (existingIFrameId) {
//         const iFrame = await IFrameManager.getIFrameById(existingIFrameId);
//         await validateHasPermissionsToIFrame(iFrame, allowedCategoriesIds);
//     }
// };

// export const validateUserCanGetIFrame = async (req: Request) => {
//     await validateUserHasPermissionsToIFrame(req.user!.id, undefined, req.params.iFrameId);
// };

// export const validateUserCanCreateIFrame = async (req: Request) => {
//     await validateUserHasPermissionsToIFrame(req.user!.id, req.body, undefined);
// };

// export const validateUserCanUpdateIFrame = async (req: Request) => {
//     await validateUserHasPermissionsToIFrame(req.user!.id, req.body, req.params.iFrameId);
// };

// export const validateUserCanDeleteIFrame = async (req: Request) => {
//     await validateUserHasPermissionsToIFrame(req.user!.id, undefined, req.params.iFrameId);
// };
