import { Router } from 'express';
import RuleBreachRequestsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createRuleBreachRequestRequestSchema,
    getRuleBreachRequestByIdRequestSchema,
    reviewRuleBreachRequestRequestSchema,
    searchRuleBreachRequestsRequestSchema,
    updateRuleBreachRequestActionMetadataRequestSchema,
} from './validator.schema';

const RuleBreachRequestsRouter: Router = Router();

RuleBreachRequestsRouter.post(
    '/search',
    ValidateRequest(searchRuleBreachRequestsRequestSchema),
    wrapController(RuleBreachRequestsController.searchRuleBreachRequests),
);

RuleBreachRequestsRouter.post(
    '/',
    ValidateRequest(createRuleBreachRequestRequestSchema),
    wrapController(RuleBreachRequestsController.createRuleBreachRequest),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/review',
    ValidateRequest(reviewRuleBreachRequestRequestSchema),
    wrapController(RuleBreachRequestsController.reviewRuleBreachRequest),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/action-metadata',
    ValidateRequest(updateRuleBreachRequestActionMetadataRequestSchema),
    wrapController(RuleBreachRequestsController.updateRuleBreachRequestActionMetadata),
);

RuleBreachRequestsRouter.get(
    '/:ruleBreachRequestId',
    ValidateRequest(getRuleBreachRequestByIdRequestSchema),
    wrapController(RuleBreachRequestsController.getRuleBreachRequestById),
);

export default RuleBreachRequestsRouter;
