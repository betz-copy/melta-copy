import { Request, Response } from 'express';
import { RuleBreachAlertsManager } from './manager';

class RuleBreachAlertsController {
    static async createRuleBreachAlert(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.createRuleBreachAlert(req.body));
    }
}

export default RuleBreachAlertsController;
