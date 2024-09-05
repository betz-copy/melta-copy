import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { BulkActionManager } from './manager';

class BulkActionController extends DefaultController<BulkActionManager> {
    constructor(workspaceId: string) {
        super(new BulkActionManager(workspaceId));
    }

    async runBulkOfActionsInMultipleTransactions(req: Request, res: Response) {
        res.json(
            await this.manager.runBulkOfActionsInMultipleTransactions(
                req.body.actionsGroups,
                req.body.ignoredRules,
                req.query.dryRun as unknown as boolean,
                req.body.userId,
            ),
        );
    }
}

export default BulkActionController;
