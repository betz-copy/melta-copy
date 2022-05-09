import { Response } from 'express';
import { UsersManager } from './manager';
import { RequestWithQuery } from '../../utils/express';

class UsersController {
    static async searchUsers(req: RequestWithQuery<{ fullName: string }>, res: Response) {
        res.json(await UsersManager.searchUsers(req.query.fullName));
    }
}

export default UsersController;
