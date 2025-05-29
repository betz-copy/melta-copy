import { Request, Response } from 'express';
import UsersManager from './manager';

class UsersController {
    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.id, req.body.workspaceIds));
    }

    static async getUserByExternalId(req: Request, res: Response) {
        res.json(await UsersManager.getUserByExternalId(req.params.externalId, req.body.workspaceIds));
    }

    static async searchUserIds(req: Request, res: Response) {
        const { search, permissions, workspaceIds, limit, step } = req.body;

        res.json(await UsersManager.searchUserIds(search, permissions, workspaceIds, limit, step));
    }

    static async searchUsers(req: Request, res: Response) {
        res.json(await UsersManager.searchUsers(req.body));
    }

    static async createUser(req: Request, res: Response) {
        res.json(await UsersManager.createUser(req.body));
    }

    static async updateUser(req: Request, res: Response) {
        res.json(await UsersManager.updateUser(req.params.id, req.body));
    }

    static async updateUsersBulk(req: Request, res: Response) {
        res.json(await UsersManager.updateUsersBulk(req.body));
    }

    static async searchUsersByPermissions(req: Request, res: Response) {
        res.json(await UsersManager.searchUsersByPermissions(req.params.workspaceId, req.query.search as string | undefined));
    }
}

export default UsersController;
