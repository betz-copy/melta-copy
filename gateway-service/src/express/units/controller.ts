import { Request, Response } from 'express';
import { UnitsManager } from './manager';

class UsersController {
    static async getHierarchyByWorkspace(req: Request, res: Response) {
        res.json(await UnitsManager.getHierarchyByWorkspace(req.user!.id, req.params.workspaceId as string));
    }
}

export default UsersController;
