import { Router } from 'express';
import RuleBreachRequestsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createRuleBreachRequestRequestSchema,
    getRuleBreachRequestByIdRequestSchema,
    getRuleBreachRequestsByRuleIdRequestSchema,
    updateRuleBreachRequestStatusRequestSchema,
    searchRuleBreachRequestsRequestSchema,
    updateRuleBreachRequestActionMetadataRequestSchema,
    updateRuleBreachRequestBrokenRulesRequestSchema,
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
    '/:ruleBreachRequestId/status',
    ValidateRequest(updateRuleBreachRequestStatusRequestSchema),
    wrapController(RuleBreachRequestsController.updateRuleBreachRequestStatus),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/action-metadata',
    ValidateRequest(updateRuleBreachRequestActionMetadataRequestSchema),
    wrapController(RuleBreachRequestsController.updateRuleBreachRequestActionMetadata),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/broken-rules',
    ValidateRequest(updateRuleBreachRequestBrokenRulesRequestSchema),
    wrapController(RuleBreachRequestsController.updateRuleBreachRequestBrokenRules),
);

RuleBreachRequestsRouter.get(
    '/:ruleBreachRequestId',
    ValidateRequest(getRuleBreachRequestByIdRequestSchema),
    wrapController(RuleBreachRequestsController.getRuleBreachRequestById),
);

RuleBreachRequestsRouter.get(
    '/broken-rules/:ruleId',
    ValidateRequest(getRuleBreachRequestsByRuleIdRequestSchema),
    wrapController(RuleBreachRequestsController.getRuleBreachRequestsByRuleId),
);

export default RuleBreachRequestsRouter;
