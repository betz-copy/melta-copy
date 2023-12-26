import { Request, Response } from 'express';
import StepInstanceManager from './manager';

class StepInstanceController {
    static async updateStep(req: Request, res: Response) {
        res.json(
            await StepInstanceManager.updateStep(req.params.processId, req.params.stepId, req.body, req.files as Express.Multer.File[], req.user!.id),
        );
    }
}

export default StepInstanceController;
