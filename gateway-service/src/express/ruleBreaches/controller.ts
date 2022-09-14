import { Request, Response } from 'express';
import { ShragaUser } from '../../utils/express/passport';
import RuleBreachesManager from './manager';

class RuleBreachesController {
    static async createRuleBreachRequest(req: Request, res: Response) {
        res.json(await RuleBreachesManager.createRuleBreachRequest(req.body, req.user!.id, req.files as Express.Multer.File[]));
    }

    static async approveRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.approveRuleBreachRequest(ruleBreachRequestId, req.user as ShragaUser));
    }

    static async denyRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.denyRuleBreachRequest(ruleBreachRequestId, req.user as ShragaUser));
    }

    static async cancelRuleBreachRequest(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.cancelRuleBreachRequest(ruleBreachRequestId, req.user as ShragaUser));
    }

    static async searchRuleBreachRequests(req: Request, res: Response) {
        res.json(await RuleBreachesManager.searchRuleBreachRequests(req.body, req.user as ShragaUser));
    }

    static async searchRuleBreachAlerts(req: Request, res: Response) {
        res.json(await RuleBreachesManager.searchRuleBreachAlerts(req.body, req.user as ShragaUser));
    }

    static async getRuleBreachRequestById(req: Request, res: Response) {
        const { ruleBreachRequestId } = req.params;

        res.json(await RuleBreachesManager.getRuleBreachRequestById(ruleBreachRequestId, req.user as ShragaUser));
    }

    static async getRuleBreachAlertById(req: Request, res: Response) {
        const { ruleBreachAlertId } = req.params;

        res.json(await RuleBreachesManager.getRuleBreachAlertById(ruleBreachAlertId, req.user as ShragaUser));
    }
}

export default RuleBreachesController;
