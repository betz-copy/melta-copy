import { IGantt } from '@packages/gantt';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import GanttManager from './manager';

export default class GanttController extends DefaultController<IGantt, GanttManager> {
    constructor(workspaceId: string) {
        super(new GanttManager(workspaceId));
    }

    async searchGantts(req: Request, res: Response) {
        res.json(await this.manager.searchGantts(req.body));
    }

    async getGanttById(req: Request, res: Response) {
        res.json(await this.manager.getGanttById(req.params.ganttId as string));
    }

    async createGantt(req: Request, res: Response) {
        res.json(await this.manager.createGantt(req.body));
    }

    async deleteGantt(req: Request, res: Response) {
        res.json(await this.manager.deleteGantt(req.params.ganttId as string));
    }

    async updateGantt(req: Request, res: Response) {
        res.json(await this.manager.updateGantt(req.params.ganttId as string, req.body));
    }
}
