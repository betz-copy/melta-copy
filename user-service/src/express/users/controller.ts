import { Request, Response } from 'express';
import { UsersManager } from './manager';

export class UsersController {
    static async getUserById(req: Request, res: Response) {
        res.json(UsersManager.getUserById(req.params.id));
    }

    static async searchUsers(req: Request, res: Response) {
        res.json(UsersManager.searchUsers(req.body));
    }

    static async createUser(req: Request, res: Response) {
        res.json(UsersManager.createUser(req.body));
    }

    static async updateUser(req: Request, res: Response) {
        res.json(UsersManager.updateUser(req.params.id, req.body));
    }

    static async updateUsersBulk(req: Request, res: Response) {
        res.json(UsersManager.updateUsersBulk(req.body));
    }
}
