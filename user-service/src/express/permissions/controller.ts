import { Request, Response } from 'express';
import { PermissionsManager } from './manager';

export class PermissionsController {
    static async getCompactPermissionsOfUser(req: Request, res: Response) {
        res.json(await PermissionsManager.getCompactPermissionsOfUser(req.query.userId as string));
    }

    static async updateCompactPermissionsOfUser(req: Request, res: Response) {
        res.json(await PermissionsManager.updatePermissionsOfUser(req.body.userId, req.body.permissions));
    }
}
