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

    async getAllTemplatesNameAndIdByWorkspaceId(req: Request, res: Response) {
        res.json(await this.manager.getAllTemplatesNameAndIdByWorkspaceId(req.params.workspaceId));
    }

    async getEntityTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getEntityTemplateById(req.body.EntityTemplate.Name));
    }
}

export default FlowCubeController;
