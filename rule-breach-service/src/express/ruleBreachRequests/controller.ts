import { Request, Response } from 'express';
import { RuleBreachRequestsManager } from './manager';

class RuleBreachRequestsController {
    static async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await RuleBreachRequestsManager.searchRuleBreachRequests(req.body));
    }

    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachRequestsManager.createRuleBreachRequest(req.body));
    }

    static async reviewRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { reviewerId, approved } = req.body;

        res.json(await RuleBreachRequestsManager.reviewRuleBreachRequest(ruleBreachRequestId, reviewerId, approved));
    }

    static async updateRuleBreachRequestActionMetadata(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { actionType, actionMetadata } = req.body;

        res.json(await RuleBreachRequestsManager.updateRuleBreachRequestActionMetadata(ruleBreachRequestId, actionType, actionMetadata));
    }

    static async updateRuleBreachRequestBrokenRules(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { brokenRules } = req.body;

        res.json(await RuleBreachRequestsManager.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, brokenRules));
    }

    static async getRuleBreachRequestById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachRequestsManager.getRuleBreachRequestById(ruleBreachRequestId));
    }

    static async getRuleBreachRequestsByRuleId(req: Request, res: Response) {
        const { ruleId } = req.params;

        res.json(await RuleBreachRequestsManager.getRuleBreachRequestsByRuleId(ruleId));
    }
}

export default RuleBreachRequestsController;
