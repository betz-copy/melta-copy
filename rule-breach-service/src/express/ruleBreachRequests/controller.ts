import { Request, Response } from 'express';
import { RuleBreachAlertsManager } from './manager';

class RuleBreachRequestsController {
    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.createRuleBreachRequest(req.body));
    }

    static async reviewRuleBreachRequest(req: Request, res: Response) {
        const { reviewerId, approved } = req.body;
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachAlertsManager.reviewRuleBreachRequest(ruleBreachRequestId, reviewerId, approved));
    }
}

export default RuleBreachRequestsController;
