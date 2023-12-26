import { Request, Response } from 'express';
import StepInstanceManager from './manager';

class StepInstanceController {
    static async getStepById(req: Request, res: Response) {
        res.json(await StepInstanceManager.getStepById(req.params.id));
    }

    static async getStepTemplateByStepInstanceId(req: Request, res: Response) {
        res.json(await StepInstanceManager.getStepTemplateByStepInstanceId(req.params.id));
    }

    static async updateStep(req: Request, res: Response) {
        res.json(await StepInstanceManager.updateStep(req.params.id, req.body));
    }
}

export default StepInstanceController;
