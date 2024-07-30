import { Request, Response } from 'express';
import { PermissionsManager } from './manager';

export class PermissionsController {
    static async getCompactPermissionsOfUser(req: Request, res: Response) {
        const { userId, workspaceIds } = req.body;

        res.json(await PermissionsManager.getCompactPermissionsOfUser(userId, workspaceIds));
    }

    static async syncCompactPermissionsOfUser(req: Request, res: Response) {
        const { userId, permissions } = req.body;

        res.json(await PermissionsManager.syncCompactPermissionsOfUser(userId, permissions));
    }

    static async deletePermissionsFromMetadata(req: Request, res: Response) {
        res.json(await PermissionsManager.deletePermissionsFromMetadata(req.body.query, req.body.metadata));
    }
}
