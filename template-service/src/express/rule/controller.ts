import { IMongoRule } from '@packages/rule';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import RuleManager from './manager';

class RuleController extends DefaultController<IMongoRule, RuleManager> {
    constructor(workspaceId: string) {
        super(new RuleManager(workspaceId));
    }

    async getRuleById(req: Request, res: Response) {
        res.json(await this.manager.getRuleById(req.params.ruleId as string));
    }

    async getManyRulesByIds(req: Request, res: Response) {
        res.json(await this.manager.getManyRulesByIds(req.body.rulesIds));
    }

    async updateRuleById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleById(req.params.ruleId as string, req.body));
    }

    async updateRuleStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleStatusById(req.params.ruleId as string, req.body.disabled));
    }

    async deleteRuleById(req: Request, res: Response) {
        res.json(await this.manager.deleteRuleById(req.params.ruleId as string));
    }

    async createRule(req: Request, res: Response) {
        res.json(await this.manager.createRule(req.body));
    }

    async searchRules(req: Request, res: Response) {
        res.json(await this.manager.searchRules(req.body));
    }
}

export default RuleController;
