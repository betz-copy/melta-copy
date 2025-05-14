import { Request, Response } from 'express';
import { PermissionsManager } from './manager';

export class PermissionsController {
    static async getCompactPermissionsOfRole(req: Request, res: Response) {
        const { roleName } = req.params;
        const { workspaceIds } = req.body;

        res.json(await PermissionsManager.getCompactPermissionsOfRole(roleName, workspaceIds));
    }

    static async syncCompactPermissionsOfRole(req: Request, res: Response) {
        const { name, permissions } = req.body;

        res.json(await PermissionsManager.syncCompactPermissionsOfRole(name, permissions));
    }

    static async deletePermissionsFromMetadata(req: Request, res: Response) {
        res.json(await PermissionsManager.deletePermissionsFromMetadata(req.body.query, req.body.metadata));
    }
}
