import { Router } from 'express';
import { wrapController } from '../../utils/express';
// import { wrapController, wrapMiddleware } from '../../utils/express';
import {
    runBulkOfActionsInMultipleTransactionsSchema,
} from './validator.schema';
import ValidateRequest from '../../utils/joi';
import RelationshipController from './controller';
// import { validateActionsGroups } from './validator.template';

const bulkActionRouter: Router = Router();

bulkActionRouter.post(
    '/bulk',
    ValidateRequest(runBulkOfActionsInMultipleTransactionsSchema),
    // wrapMiddleware(validateActionsGroups), // TODO 
    wrapController(RelationshipController.runBulkOfActionsInMultipleTransactions),
);

export default bulkActionRouter;
