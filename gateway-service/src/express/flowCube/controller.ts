import { Request, Response } from 'express';
import { FlowCubeManager } from './manager';

class FlowCubeController {
    static async searchFlowCube(req: Request, res: Response) {
        res.json(await FlowCubeManager.searchFlowCube(req.params.templateId, req.body));
    }
}

export default FlowCubeController;
