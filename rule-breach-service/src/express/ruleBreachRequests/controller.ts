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
        const { reviewerId, approved } = req.body;
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachRequestsManager.reviewRuleBreachRequest(ruleBreachRequestId, reviewerId, approved));
    }

    static async updateRuleBreachRequestActionMetadata(req: Request, res: Response) {
        const { actionType, actionMetadata } = req.body;
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachRequestsManager.updateRuleBreachRequestActionMetadata(ruleBreachRequestId, actionType, actionMetadata));
    }

    static async getRuleBreachRequestById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachRequestsManager.getRuleBreachRequestById(ruleBreachRequestId));
    }
}

export default RuleBreachRequestsController;
