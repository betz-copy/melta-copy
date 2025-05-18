import { Request, Response } from 'express';
import PermissionsManager from './manager';

class PermissionsController {
    static async getCompactPermissions(req: Request, res: Response) {
        const { relatedId } = req.params;
        const { workspaceIds } = req.body;

        res.json(await PermissionsManager.getCompactPermissionsOfRelatedId(relatedId, workspaceIds));
    }

    static async syncCompactPermissions(req: Request, res: Response) {
        const { relatedId, permissionType, permissions } = req.body;

        res.json(await PermissionsManager.syncCompactPermissions(relatedId, permissionType, permissions));
    }

    static async deletePermissionsFromMetadata(req: Request, res: Response) {
        res.json(await PermissionsManager.deletePermissionsFromMetadata(req.body.query, req.body.metadata));
    }
}

export default PermissionsController;
