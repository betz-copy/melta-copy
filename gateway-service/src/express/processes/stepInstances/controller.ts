import { Request, Response } from 'express';
import StepInstanceManager from './manager';
import DefaultController from '../../../utils/express/controller';
import { UploadedFile } from '../../../utils/busboy/interface';

class StepInstanceController extends DefaultController<StepInstanceManager> {
    constructor(workspaceId: string) {
        super(new StepInstanceManager(workspaceId));
    }

    async updateStep(req: Request, res: Response) {
        res.json(
            await this.manager.updateStep(req.params.processId, req.params.stepId, req.body, req.files as unknown as UploadedFile[], req.user!.id),
        );
    }
}

export default StepInstanceController;
