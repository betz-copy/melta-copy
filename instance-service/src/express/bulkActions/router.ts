import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import BulkActionController from './controller';
import { runBulkOfActionsInMultipleTransactionsSchema } from './validator.schema';
import BulkActionValidator from './validator.template';

const bulkActionRouter: Router = Router();
const bulkActionControllerMiddleware = createController(BulkActionController);
const bulkActionValidatorMiddleware = createController(BulkActionValidator, true);

bulkActionRouter.post(
    '/bulk',
    ValidateRequest(runBulkOfActionsInMultipleTransactionsSchema),
    bulkActionValidatorMiddleware.validateActionsGroups,
    bulkActionControllerMiddleware.runBulkOfActionsInMultipleTransactions,
);

export default bulkActionRouter;
