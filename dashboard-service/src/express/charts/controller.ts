import { IMongoChart } from '@packages/chart';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import ChartManager from './manager';

class ChartController extends DefaultController<IMongoChart, ChartManager> {
    constructor(workspaceId: string) {
        super(new ChartManager(workspaceId));
    }

    async getChartById(req: Request, res: Response) {
        res.json(await this.manager.getChartById(req.params.chartId));
    }

    async getChartByTemplateId(req: Request, res: Response) {
        const { textSearch, childTemplateId } = req.body;
        res.json(await this.manager.getChartsByTemplateId(req.params.templateId, textSearch, childTemplateId));
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
