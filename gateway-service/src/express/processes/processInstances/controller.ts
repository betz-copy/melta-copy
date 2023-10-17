import { Request, Response } from 'express';
import InstancesManager from './manager';

class ProcessInstancesController {
    static async getProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.getProcessInstance(req.params.id, req.user!.id));
    }

    static async createProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.createProcessInstance(req.body, req.files as Express.Multer.File[], req.user!.id));
    }

    static async updateProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.updateProcessInstance(req.params.id, req.body, req.files as Express.Multer.File[], req.user!.id));
    }

    static async deleteProcessInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteProcessInstance(req.params.id, req.user!.id));
    }

    static async searchProcessInstances(req: Request, res: Response) {
        res.json(await InstancesManager.searchProcessInstances(req.body, req.user!.id));
    }
}

export default ProcessInstancesController;
