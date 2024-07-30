import { promises as fsp } from 'fs';
import { promisify } from 'util';
import { Request, Response } from 'express';
import { InstancesManager } from './manager';

class InstancesController {
    static async createEntityInstance(req: Request, res: Response) {
        const { ignoredRules, ...instanceData } = req.body;
        res.json(await InstancesManager.createEntityInstance(instanceData, req.files as Express.Multer.File[], ignoredRules, req.user!.id));
    }

    static async exportEntities(req: Request, res: Response) {
        const filePath = await InstancesManager.exportEntities(req.body);
        try {
            await promisify(res.sendFile.bind(res))(filePath);
        } finally {
            await fsp.unlink(filePath);
        }
    }

    static async updateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, ...instanceData } = req.body;
        res.json(
            await InstancesManager.updateEntityInstance(req.params.id, instanceData, req.files as Express.Multer.File[], ignoredRules, req.user!.id),
        );
    }

    static async duplicateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, ...instanceData } = req.body;
        res.json(
            await InstancesManager.duplicateEntityInstance(
                req.params.id,
                instanceData,
                req.files as Express.Multer.File[],
                ignoredRules,
                req.user!.id,
            ),
        );
    }

    static async deleteEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteEntityInstance(req.params.id));
    }

    static async createRelationshipInstance(req: Request, res: Response) {
        const { relationshipInstance, ignoredRules } = req.body;

        res.json(await InstancesManager.createRelationshipInstance(relationshipInstance, ignoredRules, req.user!.id));
    }

    static async deleteRelationshipInstance(req: Request, res: Response) {
        const { ignoredRules } = req.body;

        res.json(await InstancesManager.deleteRelationshipInstance(req.params.id, ignoredRules, req.user!.id));
    }

    static async updateEntityStatus(req: Request, res: Response) {
        const { disabled, ignoredRules } = req.body;
        res.json(await InstancesManager.updateEntityStatus(req.params.id, disabled, ignoredRules, req.user!.id));
    }
}

export default InstancesController;
