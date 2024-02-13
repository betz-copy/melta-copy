import { Request, Response } from 'express';
import { UsersManager } from './manager';

export class UsersController {
    static async getUserById(req: Request, res: Response) {
        res.json(UsersManager.getUserById(req.params.id));
    }
}
