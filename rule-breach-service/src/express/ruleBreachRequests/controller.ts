import { Request, Response } from 'express';
import { RuleBreachRequestsManager } from './manager';

class RuleBreachRequestsController {
    static async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await RuleBreachRequestsManager.searchRuleBreachRequests(req.body));
    }

    static async getManyRuleBreachRequests(req: Request, res: Response) {
        console.log('gettt namyyyy');
        console.log('body: ', req.body);
        const data = await RuleBreachRequestsManager.getManyRuleBreachRequests(req.body.ruleBreachIds);
        console.log({data});
        res.json(data);
    }

    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachRequestsManager.createRuleBreachRequest(req.body));
    }

    static async updateRuleBreachRequestStatus(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { reviewerId, status } = req.body;

        res.json(await RuleBreachRequestsManager.updateRuleBreachRequestStatus(ruleBreachRequestId, reviewerId, status));
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
