import { Request, Response } from 'express';
import { InstancesManager } from './manager';

class InstancesController {
    static async createEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.createEntityInstance(req.body, req.files as Express.Multer.File[], req.user!));
    }

    static async updateEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.updateEntityInstance(req.params.id, req.body, req.files as Express.Multer.File[], req.user!));
    }

    static async duplicateEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.duplicateEntityInstance(req.params.id, req.body, req.files as Express.Multer.File[], req.user!));
    }

    static async deleteEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteEntityInstance(req.params.id));
    }

    static async createRelationshipInstance(req: Request, res: Response) {
        res.json(await InstancesManager.createRelationshipInstance(req.body, req.user!));
    }

    static async deleteRelationshipInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteRelationshipInstance(req.params.id, req.user!));
    }

    static async updateEntityStatus(req: Request, res: Response) {
        res.json(await InstancesManager.updateEntityStatus(req.params.id, req.body.disabled, req.user!));
    }
}

export default InstancesController;
