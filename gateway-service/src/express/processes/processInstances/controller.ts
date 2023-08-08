import { Request, Response } from 'express';
import InstancesManager from './manager';
import { ShragaUser } from '../../../utils/express/passport';

class ProcessInstancesController {
    static async getProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;

        res.json(await InstancesManager.getProcessInstance(req.params.id, userId));
    }

    static async createProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;

        res.json(await InstancesManager.createProcessInstance(req.body, req.files as Express.Multer.File[], userId));
    }

    static async updateProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;

        res.json(await InstancesManager.updateProcessInstance(req.params.id, req.body, req.files as Express.Multer.File[], userId));
    }

    static async deleteProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await InstancesManager.deleteProcessInstance(req.params.id, userId));
    }

    static async searchProcessInstances(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;

        res.json(await InstancesManager.searchProcessInstances(req.body, userId));
    }
}

export default ProcessInstancesController;
