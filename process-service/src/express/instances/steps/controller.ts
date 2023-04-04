import { Request, Response } from 'express';
import StepInstanceManager from './manager';

class StepInstanceController {
    static async updateStepProperties(req: Request, res: Response) {
        res.json(await StepInstanceManager.updateStepProperties(req.params.id, req.body));
    }

    static async updateStepStatus(req: Request, res: Response) {
        res.json(await StepInstanceManager.updateStepStatus(req.params.id, req.body));
    }
}

export default StepInstanceController;
