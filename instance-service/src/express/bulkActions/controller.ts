import { Request, Response } from 'express';
import { BulkActionManager } from './manager';

class BulkActionController {
    static async runBulkOfActionsInMultipleTransactions(req: Request, res: Response) {
        res.json(
            await BulkActionManager.runBulkOfActionsInMultipleTransactions(
                req.body.actionsGroups,
                req.body.ignoredRules,
                req.query.dryRun as unknown as boolean,
                req.body.userId,
            ),
        );
    }
}

export default BulkActionController;
