import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../instances/middlewares';
import { GanttManager } from './manager';

class GanttController {
    static async searchGantts(req: Request, res: Response) {
        const { body, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await GanttManager.searchGantts(body, permissionsOfUserId));
    }

    static async getGanttById(req: Request, res: Response) {
        const {
            params: { ganttId },
            permissionsOfUserId,
        } = req as RequestWithPermissionsOfUserId;

        res.json(await GanttManager.getGanttById(ganttId, permissionsOfUserId));
    }

    static async createGantt(req: Request, res: Response) {
        res.json(await GanttManager.createGantt(req.body));
    }

    static async deleteGantt(req: Request, res: Response) {
        res.json(await GanttManager.deleteGantt(req.params.ganttId));
    }

    static async updateGantt(req: Request, res: Response) {
        res.json(await GanttManager.updateGantt(req.params.ganttId, req.body));
    }

    static async isPropertyOfTemplateInUsed(req: Request, res: Response) {
        res.json(await GanttManager.isPropertyOfTemplateInUsed(req.params.templateId, req.body));
    }
}

export default GanttController;
