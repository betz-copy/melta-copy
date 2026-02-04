import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import StepInstanceManager from './manager';

class StepInstanceController extends DefaultController<StepInstanceManager> {
    constructor(workspaceId: string) {
        super(new StepInstanceManager(workspaceId));
    }

    async updateStep(req: Request, res: Response) {
        res.json(
            await this.manager.updateStep(
                req.params.processId as string,
                req.params.stepId as string,
                req.body,
                req.files || (req.file ? [req.file] : []),
                req.user!.id,
            ),
        );
    }
}

export default StepInstanceController;
