import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IRuleBreachAlert } from './interface';
import RuleBreachAlertsManager from './manager';

export default class RuleBreachAlertsController extends DefaultController<IRuleBreachAlert, RuleBreachAlertsManager> {
    constructor(dbName: string) {
        super(new RuleBreachAlertsManager(dbName));
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
