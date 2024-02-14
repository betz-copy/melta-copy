import { Request, Response } from 'express';
import { UsersManager } from './manager';

export class UsersController {
    static async getUserById(req: Request, res: Response) {
        res.json(UsersManager.getUserById(req.params.id));
    }

    static async searchUsers(req: Request, res: Response) {
        res.json(UsersManager.searchUsers(req.body));
    }

    static async updateUserPreferencesById(req: Request, res: Response) {
        res.json(UsersManager.updateUserPreferencesById(req.params.id, req.body));
    }
}
