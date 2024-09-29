import { Request } from 'express';
import { IFrame } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import DefaultController from '../../utils/express/controller';
import { Authorizer } from '../../utils/authorizer';
import IFrameManager from './manager';

export class IFramesValidator extends DefaultController {
    private iFramesManager: IFrameManager;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.iFramesManager = new IFrameManager(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
    }

    private async validateHasPermissionsToIFrame(iFrame: IFrame, allowedCategoriesIds: string[]) {
        const unauthorizedCategories = iFrame.categoryIds.filter((id) => !allowedCategoriesIds.includes(id));

        if (unauthorizedCategories.length > 0) {
            throw new ServiceError(403, 'user not authorized ', {
                metadata: `unauthorized iFrame items' categories ${JSON.stringify(unauthorizedCategories)}`,
            });
        }
    }

    async validateUserHasPermissionsToIFrame(req: Request, newIFrame: IFrame | undefined, existingIFrameId: string | undefined) {
        const [userPermissions] = await Promise.all([
            this.authorizer.getWorkspacePermissions(req.user!.id),
            this.authorizer.userCanWriteTemplates(req),
        ]);

        if (userPermissions.admin) return;

        const allowedCategoriesIds = Object.keys(userPermissions.instances?.categories ?? {});

        if (newIFrame) {
            await this.validateHasPermissionsToIFrame(newIFrame, allowedCategoriesIds);
        }
        if (existingIFrameId) {
            const iFrame = await this.iFramesManager.getIFrameById(existingIFrameId);
            await this.validateHasPermissionsToIFrame(iFrame, allowedCategoriesIds);
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
