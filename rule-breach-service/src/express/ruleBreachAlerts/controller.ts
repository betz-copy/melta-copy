import { Request, Response } from 'express';
import { RuleBreachAlertsManager } from './manager';

class RuleBreachAlertsController {
    static async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.searchRuleBreachAlerts(req.body));
    }

    static async createRuleBreachAlert(req: Request, res: Response) {
        res.json(await RuleBreachAlertsManager.createRuleBreachAlert(req.body));
    }

    static async updateRuleBreachAlertActionMetadata(req: Request, res: Response) {
        const { actionType, actionMetadata } = req.body;
        const { ruleBreachAlertId } = req.params;

        res.json(await RuleBreachAlertsManager.updateRuleBreachAlertActionMetadata(ruleBreachAlertId, actionType, actionMetadata));
    }

    static async getRuleBreachAlertById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await RuleBreachAlertsManager.getRuleBreachAlertById(ruleBreachAlertId));
    }
}

export default RuleBreachAlertsController;
