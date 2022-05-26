import { Request, Response } from 'express';
import { InstancesManager } from './manager';

class InstancesController {
    static async createEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.createEntityInstance(req.body, req.files as Express.Multer.File[]));
    }

    static async updateEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.updateEntityInstance(req.params.id, req.body, req.files as Express.Multer.File[]));
    }

    static async deleteEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteEntityInstance(req.params.id));
    }
}

export default InstancesController;
