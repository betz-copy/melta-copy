import { Request, Response } from 'express';
import StepInstanceManager from './manager';
import DefaultController from '../../../utils/express/controller';

class StepInstanceController extends DefaultController<StepInstanceManager> {
    constructor(workspaceId: string) {
        super(new StepInstanceManager(workspaceId));
    }

    async updateStep(req: Request, res: Response) {
        res.json(await this.manager.updateStep(req.params.processId, req.params.stepId, req.body, req.files as Express.Multer.File[], req.user!.id));
    }
}

export default StepInstanceController;
