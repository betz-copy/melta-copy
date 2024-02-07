import { Request, Response } from 'express';
import { PermissionsManager } from './manager';

export class PermissionsController {
    static async getCompactPermissionsOfUser(req: Request, res: Response) {
        res.json(await PermissionsManager.getCompactPermissionsOfUser(req.query.userId as string));
    }
}
