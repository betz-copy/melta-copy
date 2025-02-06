import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { FlowCubeManager } from './manager';

class FlowCubeController extends DefaultController<FlowCubeManager> {
    constructor(workspaceId: string) {
        super(new FlowCubeManager(workspaceId));
    }

    async searchFlowCube(req: Request, res: Response) {
        res.json(await this.manager.searchFlowCube(req.params.templateId, req.body));
    }

    static async searchWorkspaces(req: Request, res: Response) {
        res.json(await FlowCubeManager.searchWorkspace(req.body, req.user!.id));
    }

    async searchCategory(req: Request, res: Response) {
        res.json(await this.manager.searchCategory(req.body, req.user!.id));
    }

    async searchTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body, req.user!.id));
    }

    async getEntityTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getEntityTemplateById(req.body.TemplateType));
    }

    async searchEntitiesByTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesByTemplate(req.body));
    }
}

export default FlowCubeController;
