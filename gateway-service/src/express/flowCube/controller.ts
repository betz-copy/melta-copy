import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import FlowCubeManager from './manager';

class FlowCubeController extends DefaultController<FlowCubeManager> {
    constructor(workspaceId: string) {
        super(new FlowCubeManager(workspaceId));
    }

    async searchFlowCube(req: Request, res: Response) {
        const { workspaceId, templateId } = req.params;
        res.json(await this.manager.searchFlowCube(workspaceId as string, templateId as string, req.body));
    }

    static async searchWorkspaces(req: Request, res: Response) {
        res.json(await FlowCubeManager.searchWorkspace(req.body, req.user!));
    }

    async searchCategory(req: Request, res: Response) {
        res.json(await this.manager.searchCategory(req.body, req.user!));
    }

    async searchEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntityTemplate(req.body, req.user!));
    }

    async getEntityTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getEntityTemplateById(req.body.TemplateType));
    }

    async searchEntitiesByTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesByTemplate(req.body));
    }
}

export default FlowCubeController;
