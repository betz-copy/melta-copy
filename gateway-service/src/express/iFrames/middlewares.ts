import { IFrame } from '@packages/iframe';
import { ForbiddenError } from '@packages/utils';
import { Request } from 'express';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import IFrameManager from './manager';

class IFramesValidator extends DefaultController {
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
            throw new ForbiddenError('user not authorized ', {
                metadata: `unauthorized iFrame items' categories ${JSON.stringify(unauthorizedCategories)}`,
            });
        }
    }

    async validateUserHasPermissionsToIFrame(req: Request, newIFrame: IFrame | undefined, existingIFrameId: string | undefined, adminAction = false) {
        const [userPermissions] = await Promise.all([
            this.authorizer.getWorkspacePermissions(req.user!.id),
            adminAction && this.authorizer.userCanWriteTemplates(req),
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
        const { toDashboard } = req.query as { toDashboard?: boolean };
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (toDashboard && !userPermissions.admin?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on dashboard` });

        await this.validateUserHasPermissionsToIFrame(req, req.body, undefined, true);
    }

    async validateUserCanUpdateIFrame(req: Request) {
        await this.validateUserHasPermissionsToIFrame(req, req.body, req.params.iFrameId, true);
    }

    async validateUserCanDeleteIFrame(req: Request) {
        const { deleteReferenceDashboardItems } = req.query as { deleteReferenceDashboardItems?: boolean };
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (deleteReferenceDashboardItems && !userPermissions.admin?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on dashboard` });

        await this.validateUserHasPermissionsToIFrame(req, undefined, req.params.iFrameId, true);
    }
}

export default IFramesValidator;
