import { Request, Response } from 'express';
import { UsersManager } from './manager';
import { RequestWithQuery } from '../../utils/express';

class UsersController {
    static async searchUsers(req: RequestWithQuery<{ fullName: string }>, res: Response) {
        res.json(await UsersManager.searchUsers(req.query.fullName));
    }

    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.userId));
    }
}

export default UsersController;
