import { Request, Response } from 'express';
import { RuleManager } from './manager';

class RuleController {
    static async getRuleById(req: Request, res: Response) {
        res.json(await RuleManager.getRuleById(req.params.ruleId));
    }

    static async updateRuleById(req: Request, res: Response) {
        res.json(await RuleManager.updateRuleById(req.params.ruleId, req.body));
    }

    static async updateRuleStatusById(req: Request, res: Response) {
        res.json(await RuleManager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    static async deleteRuleById(req: Request, res: Response) {
        res.json(await RuleManager.deleteRuleById(req.params.ruleId));
    }

    static async createRule(req: Request, res: Response) {
        res.json(await RuleManager.createRule(req.body));
    }

    static async searchRules(req: Request, res: Response) {
        res.json(await RuleManager.searchRules(req.body));
    }
}

export default RuleController;
