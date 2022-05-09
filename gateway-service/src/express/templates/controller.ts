import * as assert from 'assert';
import { Request, Response } from 'express';
import { TemplatesManager } from './manager';

class TemplatesController {
    // all
    static async getAllAllowedTemplates(req: Request, res: Response) {
        const { user } = req;

        assert(user, 'User doesnt exists under request');

        res.json(await TemplatesManager.getAllAllowedTemplates(user.id));
    }
}

export default TemplatesController;
