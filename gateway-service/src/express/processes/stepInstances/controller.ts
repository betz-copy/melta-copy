import { Request, Response } from 'express';
import StepInstanceManager from './manager';
import { ShragaUser } from '../../../utils/express/passport';

class StepInstanceController {
    static async updateStep(req: Request, res: Response) {
        const { id } = req.user as ShragaUser;

        res.json(await StepInstanceManager.updateStep(req.params.processId, req.params.stepId, req.body, req.files as Express.Multer.File[], id));
    }
}

export default StepInstanceController;
