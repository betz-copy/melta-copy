import { IMongoChart } from '@packages/chart';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import ChartManager from './manager';

class ChartController extends DefaultController<IMongoChart, ChartManager> {
    constructor(workspaceId: string) {
        super(new ChartManager(workspaceId));
    }

    async getChartById(req: Request, res: Response) {
        res.json(await this.manager.getChartById(req.params.chartId as string));
    }

    async getChartByTemplateId(req: Request, res: Response) {
        const { textSearch, childTemplateId } = req.body;
        res.json(await this.manager.getChartsByTemplateId(req.params.templateId as string, textSearch, childTemplateId));
    }

    async createChart(req: Request, res: Response) {
        res.json(await this.manager.createChart(req.body));
    }

    async deleteChart(req: Request, res: Response) {
        res.json(await this.manager.deleteChart(req.params.chartId as string));
    }

    async updateChart(req: Request, res: Response) {
        res.json(await this.manager.updateChart(req.params.chartId as string, req.body));
    }
}

export default ChartController;
