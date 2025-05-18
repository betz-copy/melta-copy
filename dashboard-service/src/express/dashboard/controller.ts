import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { DashboardItem } from './interface';
import { DashboardManager } from './manager';

class DashboardController extends DefaultController<DashboardItem, DashboardManager> {
    constructor(workspaceId: string) {
        super(new DashboardManager(workspaceId));
    }

    async createDashboardItem(req: Request, res: Response) {
        res.json(await this.manager.createDashboardItem(req.body));
    }

    async getDashboardItemById(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.getDashboardItemById(dashboardItemId));
    }

    async editDashboardItem(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.editDashboardItem(dashboardItemId, req.body));
    }

    async deleteDashboardItem(req: Request, res: Response) {
        const { dashboardItemId } = req.params;
        res.json(await this.manager.deleteDashboardItem(dashboardItemId));
    }

    async getChartsByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.searchDashboardItems(req.body.textSearch));
    }
}

export default DashboardController;
