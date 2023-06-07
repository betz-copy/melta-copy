import { Request, Response } from 'express';
import { RequestWithQuery } from '../../utils/express';
import { PermissionsManager } from './manager';

class PermissionsController {
    static async getPermissionsOfUsers(_req: Request, res: Response) {
        res.json(await PermissionsManager.getPermissionsOfUsers());
    }

    static async getMyPermissions(req: Request, res: Response) {
        res.json(await PermissionsManager.getPermissionsOfUser(req.user!.id));
    }

    static async createPermissionsBulk(req: Request, res: Response) {
        console.log("ffffffff")
        res.json(await PermissionsManager.createPermissionsBulk(req.body));
    }

    static async deletePermissions(req: RequestWithQuery<{ ids: string[] }>, res: Response) {
        res.json(await PermissionsManager.deletePermissions(req.query.ids));
    }
}

export default PermissionsController;
