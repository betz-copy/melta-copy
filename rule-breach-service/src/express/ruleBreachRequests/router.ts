import { Router } from 'express';
import RuleBreachRequestsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createRuleBreachRequestSchema, reviewRuleBreachRequestSchema } from './validator.schema';

const RuleBreachRequestsRouter: Router = Router();

RuleBreachRequestsRouter.post(
    '/',
    ValidateRequest(createRuleBreachRequestSchema),
    wrapController(RuleBreachRequestsController.createRuleBreachRequest),
);
RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/review',
    ValidateRequest(reviewRuleBreachRequestSchema),
    wrapController(RuleBreachRequestsController.reviewRuleBreachRequest),
);

export default RuleBreachRequestsRouter;
