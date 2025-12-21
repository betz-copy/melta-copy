import { IRuleBreachRequest } from '@packages/rule-breach';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import RuleBreachRequestsManager from './manager';

export default class RuleBreachRequestsController extends DefaultController<IRuleBreachRequest, RuleBreachRequestsManager> {
    constructor(workspaceId: string) {
        super(new RuleBreachRequestsManager(workspaceId));
    }

    async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await this.manager.searchRuleBreachRequests(req.body));
    }

    async getManyRuleBreachRequests(req: Request, res: Response) {
        res.json(await this.manager.getManyRuleBreachRequests(req.body.rulesBreachIds));
    }

    async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await this.manager.createRuleBreachRequest(req.body));
    }

    async updateManyRuleBreachRequestsStatusesByRelatedEntityId(req: Request, res: Response) {
        const { status } = req.body;
        const { entityId } = req.params;

        res.json(await this.manager.updateManyRuleBreachRequestsStatusesByRelatedEntityId(entityId, status));
    }

    async updateRuleBreachRequestStatus(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { reviewerId, status } = req.body;

        res.json(await this.manager.updateRuleBreachRequestStatus(ruleBreachRequestId, reviewerId, status));
    }

    async updateRuleBreachRequestActionsMetadatas(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { actions } = req.body;

        res.json(await this.manager.updateRuleBreachRequestActionsMetadatas(ruleBreachRequestId, actions));
    }

    async updateRuleBreachRequestBrokenRules(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { brokenRules } = req.body;

        res.json(await this.manager.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, brokenRules));
    }

    async getRuleBreachRequestById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await this.manager.getRuleBreachRequestById(ruleBreachRequestId));
    }

    async getRuleBreachRequestsByRuleId(req: Request, res: Response) {
        const { ruleId } = req.params;

        res.json(await this.manager.getRuleBreachRequestsByRuleId(ruleId));
    }
}
