import { Request, Response } from 'express';
import RuleBreachesManager from './manager';

class RuleBreachesController {
    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachesManager.createRuleBreachRequest(req.body, req.user!.id, req.files as Express.Multer.File[]));
    }

    static async getManyRuleBreachRequests(req: Request, res: Response) {
        res.json(await RuleBreachesManager.getManyRuleBreachRequests(req.body));
    }

    static async approveRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.approveRuleBreachRequest(ruleBreachRequestId, req.user!));
    }

    static async denyRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.denyRuleBreachRequest(ruleBreachRequestId, req.user!));
    }

    static async cancelRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.cancelRuleBreachRequest(ruleBreachRequestId, req.user!));
    }

    static async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await RuleBreachesManager.searchRuleBreachRequests(req.body, req.user!));
    }

    static async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await RuleBreachesManager.searchRuleBreachAlerts(req.body, req.user!));
    }

    static async getRuleBreachRequestsById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.getRuleBreachRequestById(ruleBreachRequestId, req.user!));
    }

    static async getRuleBreachAlertsById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await RuleBreachesManager.getRuleBreachAlertsById(ruleBreachAlertId, req.user!));
    }
}

export default RuleBreachesController;
