import { Request } from 'express';
import { IFrame } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
// import PermissionsManager from '../permissions/manager';
// import IFrameManager from './manager';
// import { IPermissionsOfUser } from '../permissions/interfaces';
import DefaultController from '../../utils/express/controller';
// import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { InstancesValidator } from '../instances/middlewares';
import { Authorizer } from '../../utils/authorizer';

export class IFramesValidator extends DefaultController {
    // private iFramesService: IFrameService;

    // private instancesValidator: InstancesValidator;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        // this.ganttsService = new GanttsService(workspaceId);
        // this.instancesValidator = new InstancesValidator(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
    }
    async validateHasPermissionsToIFrame(iFrame: IFrame, allowedCategoriesIds: string[]) {
        const unauthorizedCategories = iFrame.categoryIds.filter((id) => !allowedCategoriesIds.includes(id));

        if (unauthorizedCategories.length > 0) {
            throw new ServiceError(403, 'user not authorized ', {
                metadata: `unauthorized iFrame items' categories ${JSON.stringify(unauthorizedCategories)}`,
            });
        }
    }

    // private async getAllowedCategories(userPermissions: ISubCompactPermissions) {
    //     // return userPermissions.instancesPermissions.filter((permission) => permission.scopes.includes('Read')).map((permission) => permission.category);
    //     const allowedCategories = Object.keys(userPermissions.instances?.categories ?? {});
    //     console.log({ allowedCategories });
    //     return allowedCategories;
    // }

    async validateUserHasPermissionsToIFrame(req: Request, newIFrame: IFrame | undefined, existingIFrameId: string | undefined) {
        const [userPermissions] = await Promise.all([
            this.authorizer.getWorkspacePermissions(req.user!.id),
            this.authorizer.userCanWriteTemplates(req),
        ]);
        const allowedCategoriesIds = userPermissions.instances?.categories;
        console.log({ allowedCategoriesIds });

        // const allowedCategoriesIds: string[] = this.getAllowedCategories(userPermissions);
        // const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(userPermissions);
        // const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        if (newIFrame) {
            // await this.validateHasPermissionsToIFrame(newIFrame, allowedCategoriesIds);
        }
        if (existingIFrameId) {
            // const iFrame = await IFrameManager.getIFrameById(existingIFrameId);
            // await this.validateHasPermissionsToIFrame(iFrame, allowedCategoriesIds);
        }
    }

    async validateUserCanGetIFrame(req: Request) {
        await this.validateUserHasPermissionsToIFrame(req, undefined, req.params.iFrameId);
    }

    async validateUserCanCreateIFrame(req: Request) {
        await this.validateUserHasPermissionsToIFrame(req, req.body, undefined);
    }

    async validateUserCanUpdateIFrame(req: Request) {
        await this.validateUserHasPermissionsToIFrame(req, req.body, req.params.iFrameId);
    }

    async validateUserCanDeleteIFrame(req: Request) {
        await this.validateUserHasPermissionsToIFrame(req, undefined, req.params.iFrameId);
    }
}
