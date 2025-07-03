import { Request, Response } from 'express';
import RuleBreachesManager from './manager';
import DefaultController from '../../utils/express/controller';

class RuleBreachesController extends DefaultController<RuleBreachesManager> {
    constructor(workspaceId: string) {
        super(new RuleBreachesManager(workspaceId));
    }

    async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await this.manager.createRuleBreachRequest(req.body, req.user!.id, req.files));
    }

    async getManyRuleBreachRequests(req: Request, res: Response) {
        res.json(await this.manager.getManyRuleBreachRequests(req.body));
    }

    async approveRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await this.manager.approveRuleBreachRequest(ruleBreachRequestId, req.user!, req.body.childTemplateId));
    }

    async denyRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await this.manager.denyRuleBreachRequest(ruleBreachRequestId, req.user!));
    }

    async cancelRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await this.manager.cancelRuleBreachRequest(ruleBreachRequestId, req.user!));
    }

    async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await this.manager.searchRuleBreachRequests(req.body, req.user!));
    }

    async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await this.manager.searchRuleBreachAlerts(req.body, req.user!));
    }

    async getRuleBreachRequestsById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await this.manager.getRuleBreachRequestById(ruleBreachRequestId, req.user!));
    }

    async getRuleBreachAlertsById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await this.manager.getRuleBreachAlertsById(ruleBreachAlertId, req.user!));
    }
}

export default RuleBreachesController;
