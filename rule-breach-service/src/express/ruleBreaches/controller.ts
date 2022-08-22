import { Request, Response } from 'express';
import { RuleBreachesManager } from './manager';

class RuleBreachesController {
    static async searchRuleBreaches(req: Request, res: Response) {
        const { originUserId, ...agGridRequest } = req.body;

        res.json(await RuleBreachesManager.searchRuleBreaches(originUserId, agGridRequest));
    }

    static async updateRuleBreachActionMetadata(req: Request, res: Response) {
        const { ruleBreachId } = req.params;

        res.json(await RuleBreachesManager.updateRuleBreachActionMetadata(ruleBreachId, req.body));
    }

    static async getRuleBreachById(req: Request, res: Response) {
        const { ruleBreachId } = req.params;

        res.json(await RuleBreachesManager.getRuleBreachById(ruleBreachId));
    }
}

export default RuleBreachesController;
