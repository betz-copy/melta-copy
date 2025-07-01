import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import DashboardManager from './manager';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

class DashboardController extends DefaultController<DashboardManager> {
    constructor(workspaceId: string) {
        super(new DashboardManager(workspaceId));
    }

    async searchDashboardItems(req: Request, res: Response) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.searchDashboardItems(user!.id, permissionsOfUserId, body.textSearch));
    }
}

export default DashboardController;
