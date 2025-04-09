import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { ChartManager } from './manager';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

export class ChartController extends DefaultController<ChartManager> {
    constructor(workspaceId: string) {
        super(new ChartManager(workspaceId));
    }

    async getChartById(req: Request, res: Response) {
        res.json(await this.manager.getChartById(req.params.chartId));
    }

    async getChartsByTemplateId(req: Request, res: Response) {
        const { body, params, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.getChartsOfTemplateId(params.templateId, user?.id!, permissionsOfUserId, body.textSearch));
    }

    async createChart(req: Request, res: Response) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.createChart(body, user?.id!, permissionsOfUserId));
    }

    async deleteChart(req: Request, res: Response) {
        res.json(await this.manager.deleteChart(req.params.chartId));
    }

    async updateChart(req: Request, res: Response) {
        const { body, params, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.updateChart(params.chartId, body, user?.id, permissionsOfUserId));
    }
}
