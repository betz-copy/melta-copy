import { Request, Response } from 'express';
import { RuleBreachesManager } from './manager';

class RuleBreachesController {
    static async searchRuleBreaches(req: Request, res: Response) {
        const { originUserId, ...agGridRequest } = req.body;

        res.json(await RuleBreachesManager.searchRuleBreaches(originUserId, agGridRequest));
    }
}

export default RuleBreachesController;
