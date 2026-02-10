import { MongoDashboardItem } from '@packages/dashboard';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import DashboardManager from './manager';

class DashboardController extends DefaultController<MongoDashboardItem, DashboardManager> {
    constructor(workspaceId: string) {
        super(new DashboardManager(workspaceId));
    }

    async createDashboardItem(req: Request, res: Response) {
        res.json(await this.manager.createDashboardItem(req.body));
    }

    async getDashboardItemById(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.getDashboardItemById(dashboardItemId as string));
    }

    async getDashboardRelatedItems(req: Request, res: Response) {
        res.json(await this.manager.getDashboardRelatedItems(req.body.relatedIds));
    }

    async editDashboardItem(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.editDashboardItem(dashboardItemId as string, req.body));
    }

    async deleteDashboardItem(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.deleteDashboardItem(dashboardItemId as string));
    }

    async searchDashboardItems(req: Request, res: Response) {
        res.json(await this.manager.searchDashboardItems(req.body.textSearch));
    }

    async deleteDashboardItemByRelatedItem(req: Request, res: Response) {
        const { relatedId } = req.params;
        res.json(await this.manager.deleteDashboardItemByRelatedItem(relatedId as string));
    }
}

export default DashboardController;
