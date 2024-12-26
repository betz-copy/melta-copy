import { Request, Response } from 'express';
import { GanttManager } from './manager';
import DefaultController from '../../utils/express/controller';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

class GanttController extends DefaultController<GanttManager> {
    constructor(workspaceId: string) {
        super(new GanttManager(workspaceId));
    }

    async searchGantts(req: Request, res: Response) {
        const { body, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await this.manager.searchGantts(body, permissionsOfUserId));
    }

    async getGanttById(req: Request, res: Response) {
        const {
            params: { ganttId },
            permissionsOfUserId,
        } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.getGanttById(ganttId, permissionsOfUserId));
    }

    async createGantt(req: Request, res: Response) {
        res.json(await this.manager.createGantt(req.body));
    }

    async deleteGantt(req: Request, res: Response) {
        res.json(await this.manager.deleteGantt(req.params.ganttId));
    }

    async updateGantt(req: Request, res: Response) {
        res.json(await this.manager.updateGantt(req.params.ganttId, req.body));
    }
}

export default GanttController;
