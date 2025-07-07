import { Request, Response } from 'express';
import { DefaultController, IMongoChart } from '@microservices/shared';
import ChartManager from './manager';

class ChartController extends DefaultController<IMongoChart, ChartManager> {
    constructor(workspaceId: string) {
        super(new ChartManager(workspaceId));
    }

    async getChartById(req: Request, res: Response) {
        res.json(await this.manager.getChartById(req.params.chartId));
    }

    async getChartByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getChartsByTemplateId(req.params.templateId, req.body.textSearch, req.body.isChildTemplate));
    }

    async createChart(req: Request, res: Response) {
        res.json(await this.manager.createChart(req.body));
    }

    async deleteChart(req: Request, res: Response) {
        res.json(await this.manager.deleteChart(req.params.chartId));
    }

    async updateChart(req: Request, res: Response) {
        res.json(await this.manager.updateChart(req.params.chartId, req.body));
    }
}

export default ChartController;
