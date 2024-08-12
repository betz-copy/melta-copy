import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IRuleBreachRequest } from './interface';
import RuleBreachRequestsManager from './manager';

export default class RuleBreachRequestsController extends DefaultController<IRuleBreachRequest, RuleBreachRequestsManager> {
    constructor(dbName: string) {
        super(new RuleBreachRequestsManager(dbName));
    }

    static async getManyRuleBreachRequests(req: Request, res: Response) {
        const data = await RuleBreachRequestsManager.getManyRuleBreachRequests(req.body.rulesBreachIds);
        res.json(data);
    }

    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachRequestsManager.createRuleBreachRequest(req.body));
    }

    async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await this.manager.createRuleBreachRequest(req.body));
    }

    async updateRuleBreachRequestStatus(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { reviewerId, status } = req.body;

        res.json(await this.manager.updateRuleBreachRequestStatus(ruleBreachRequestId, reviewerId, status));
    }

    static async updateRuleBreachRequestActionsMetadatas(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;
        const { actions } = req.body;

        res.json(await RuleBreachRequestsManager.updateRuleBreachRequestActionsMetadatas(ruleBreachRequestId, actions));
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
