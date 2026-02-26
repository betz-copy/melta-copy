import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import ChartManager from './manager';

class ChartController extends DefaultController<ChartManager> {
    constructor(workspaceId: string) {
        super(new ChartManager(workspaceId));
    }

    async getChartById(req: Request, res: Response) {
        res.json(await this.manager.getChartById(req.params.chartId as string));
    }

    async getChartsByTemplateId(req: Request, res: Response) {
        const { body, params, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.getChartsOfTemplateId(params.templateId as string, user!, permissionsOfUserId, body));
    }

    async searchChartByUserId(req: Request, res: Response) {
        const { body, params, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.searchChartByUserId(params.templateId as string, user!._id, body));
    }

    async createChart(req: Request, res: Response) {
        res.json(await this.manager.createChart(req.body, req.query.toDashboard as boolean | undefined));
    }

    async updateChart(req: Request, res: Response) {
        res.json(
            await this.manager.updateChart(req.params.chartId as string, req.body, req.query.deleteReferenceDashboardItems as boolean | undefined),
        );
    }

    async deleteChart(req: Request, res: Response) {
        res.json(await this.manager.deleteChart(req.params.chartId as string, req.query.deleteReferenceDashboardItems as boolean | undefined));
    }
}

export default ChartController;
