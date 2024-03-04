import { Request, Response } from 'express';
import { UsersManager } from './manager';

export class UsersController {
    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.id));
    }

    static async searchUsers(req: Request, res: Response) {
        const { search, permissions, limit, step } = req.body;

        res.json(await UsersManager.searchUsers(search, permissions, limit, step));
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
}
