import { Request, Response } from 'express';
import { CheckAuthorizationBody } from './interface';
import { PermissionsManager } from './manager';

class PermissionsController {
    static async getPermissions(req: Request, res: Response) {
        res.json(await PermissionsManager.getPermissions(req.query));
    }

    static async getPermissionById(req: Request, res: Response) {
        const { id } = req.params;

        res.json(await PermissionsManager.getPermissionById(id));
    }

    static async createPermission(req: Request, res: Response) {
        res.json(await PermissionsManager.createPermission(req.body));
    }

    static async updatePermission(req: Request, res: Response) {
        const { id } = req.params;
        res.json(await PermissionsManager.updatePermission(id, req.body));
    }

    static async checkUserAuthorization(req: Request, res: Response) {
        const { userId } = req.params;

        res.json(await PermissionsManager.checkUserAuthorization(userId, req.body as CheckAuthorizationBody));
    }

    static async deletePermission(req: Request, res: Response) {
        const { id } = req.params;
        res.json(await PermissionsManager.deletePermission(id));
    }

    static async deletePermissions(req: Request, res: Response) {
        res.json(await PermissionsManager.deletePermissions(req.query));
    }
}

export default PermissionsController;
