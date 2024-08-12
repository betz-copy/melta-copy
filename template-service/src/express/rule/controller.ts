import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IMongoRule } from './interfaces';
import { RuleManager } from './manager';

class RuleController extends DefaultController<IMongoRule, RuleManager> {
    constructor(dbName: string) {
        super(new RuleManager(dbName));
    }

    static async getManyRulesByIds(req: Request, res: Response) {
        res.json(await RuleManager.getManyRulesByIds(req.body.rulesIds));
    }

    static async updateRuleById(req: Request, res: Response) {
        res.json(await RuleManager.updateRuleById(req.params.ruleId, req.body));
    }

    async updateRuleById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleById(req.params.ruleId, req.body));
    }

    async updateRuleStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    async deleteRuleById(req: Request, res: Response) {
        res.json(await this.manager.deleteRuleById(req.params.ruleId));
    }

    async createRule(req: Request, res: Response) {
        res.json(await this.manager.createRule(req.body));
    }

    async searchRules(req: Request, res: Response) {
        res.json(await this.manager.searchRules(req.body));
    }
}

export default RuleController;
