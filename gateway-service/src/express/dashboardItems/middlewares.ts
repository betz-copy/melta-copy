import { Request } from 'express';
import { ForbiddenError } from '@microservices/shared';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';

class DashboardValidator extends DefaultController {
    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.authorizer = new Authorizer(workspaceId);
    }

    private async validateUserCanManipulateDashboard(req: Request) {
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (!userPermissions.admin?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on dashboard` });
    }

    async validateUserCanGetDashboardById(req: Request) {
        return this.validateUserCanManipulateDashboard(req);
    }

    async validateUserCanCreateDashboard(req: Request) {
        return this.validateUserCanManipulateDashboard(req);
    }

    async validateUserCanUpdateDashboard(req: Request) {
        return this.validateUserCanManipulateDashboard(req);
    }

    async validateUserCanDeleteDashboard(req: Request) {
        return this.validateUserCanManipulateDashboard(req);
    }
}

export default DashboardValidator;
