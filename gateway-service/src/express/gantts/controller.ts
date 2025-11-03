import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import { GanttManager } from './manager';

class GanttController extends DefaultController<GanttManager> {
    constructor(workspaceId: string) {
        super(new GanttManager(workspaceId));
    }

    async searchGantts(req: Request, res: Response) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;
        res.json(await this.manager.searchGantts(body, permissionsOfUserId, user!.id));
    }

    async getGanttById(req: Request, res: Response) {
        const {
            params: { ganttId },
            permissionsOfUserId,
            user,
        } = req as RequestWithPermissionsOfUserId;

        res.json(await this.manager.getGanttById(ganttId, permissionsOfUserId, user!.id));
    }

    async createGantt(req: Request, res: Response) {
        res.json(await this.manager.createGantt(req.body, req.user!.id));
    }

    async deleteGantt(req: Request, res: Response) {
        res.json(await this.manager.deleteGantt(req.params.ganttId));
    }

    async updateGantt(req: Request, res: Response) {
        res.json(await this.manager.updateGantt(req.params.ganttId, req.body, req.user!.id));
    }
}

export default GanttController;
