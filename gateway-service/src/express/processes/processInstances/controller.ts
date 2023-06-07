import { Request, Response } from 'express';
import InstancesManager from './manager';
import { ShragaUser } from '../../../utils/express/passport';

class ProcessInstancesController {
    static async getProcessInstance(req: Request, res: Response) {
        const { id } = req.user as ShragaUser;

        res.json(await InstancesManager.getProcessInstance(req.params.id, id));
    }

    static async createProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.createProcessInstance(req.body, req.files as Express.Multer.File[]));
    }

    static async updateProcessInstance(req: Request, res: Response) {
        const { id } = req.user as ShragaUser;

        res.json(await InstancesManager.updateProcessInstance(req.params.id, req.body, req.files as Express.Multer.File[], id));
    }

    static async deleteProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteProcessInstance(req.params.id));
    }

    static async searchProcessInstances(req: Request, res: Response) {
        const { id } = req.user as ShragaUser;

        res.json(await InstancesManager.searchProcessInstances(req.body, id));
    }
}

export default ProcessInstancesController;
