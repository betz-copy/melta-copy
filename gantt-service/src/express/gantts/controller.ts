import { Request, Response } from 'express';
import { GanttManager } from './manager';

class GanttController {
    static async searchGantts(req: Request, res: Response) {
        res.json(await GanttManager.searchGantts(req.body));
    }

    static async getGanttById(req: Request, res: Response) {
        res.json(await GanttManager.getGanttById(req.params.ganttId));
    }

    static async createGantt(req: Request, res: Response) {
        res.json(await GanttManager.createGantt(req.body));
    }

    static async deleteGantt(req: Request, res: Response) {
        res.json(await GanttManager.deleteGantt(req.body));
    }

    static async updateGantt(req: Request, res: Response) {
        res.json(await GanttManager.updateGantt(req.params.ganttId, req.body));
    }
}

export default GanttController;
