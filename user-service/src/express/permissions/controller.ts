import { Request, Response } from 'express';
import { PermissionsManager } from './manager';

export class PermissionsController {
    static async getCompactPermissionsOfUser(req: Request, res: Response) {
        res.json(await PermissionsManager.getCompactPermissionsOfUser(req.query.userId as string));
    }

    static async syncCompactPermissionsOfUser(req: Request, res: Response) {
        res.json(await PermissionsManager.syncCompactPermissionsOfUser(req.body.userId, req.body.permissions));
    }
}
