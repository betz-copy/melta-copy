import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import SimbaManager from './manager';

class SimbaController extends DefaultController<SimbaManager> {
    constructor(workspaceId: string) {
        super(new SimbaManager(workspaceId));
    }

    async getAllTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllTemplates());
    }

    async getInstancesByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getInstancesByTemplateId(req.params.templateId, req.body.kartoffelId));
    }

    async getEntityChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getEntityChildTemplateById(req.params.templateId));
    }
}

export default SimbaController;
