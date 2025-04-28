import { Request, Response } from 'express';
import { IRuleBreachAlert, DefaultController } from '@microservices/shared';
import RuleBreachAlertsManager from './manager';

export default class RuleBreachAlertsController extends DefaultController<IRuleBreachAlert, RuleBreachAlertsManager> {
    constructor(workspaceId: string) {
        super(new RuleBreachAlertsManager(workspaceId));
    }

    async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await this.manager.searchRuleBreachAlerts(req.body));
    }

    async createRuleBreachAlert(req: Request, res: Response) {
        res.json(await this.manager.createRuleBreachAlert(req.body));
    }

    async getRuleBreachAlertById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await this.manager.getRuleBreachAlertsById(ruleBreachAlertId));
    }

    async getRuleBreachAlertsByRuleId(req: Request, res: Response) {
        const { ruleId } = req.params;

        res.json(await this.manager.getRuleBreachAlertsByRuleId(ruleId));
    }
}
