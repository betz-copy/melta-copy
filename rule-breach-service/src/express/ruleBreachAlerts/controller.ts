import { Request, Response } from 'express';
import { RuleBreachAlertsManager } from './manager';

class RuleBreachAlertsController {
    static async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.searchRuleBreachAlerts(req.body));
    }

    static async createRuleBreachAlert(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.createRuleBreachAlert(req.body));
    }

    static async getRuleBreachAlertById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await RuleBreachAlertsManager.getRuleBreachAlertById(ruleBreachAlertId));
    }
}

export default RuleBreachAlertsController;
