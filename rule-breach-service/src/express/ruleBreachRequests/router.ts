import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import RuleBreachRequestsController from './controller';
import {
    createRuleBreachRequestRequestSchema,
    getRuleBreachRequestByIdRequestSchema,
    getRuleBreachRequestsByRuleIdRequestSchema,
    searchRuleBreachRequestsRequestSchema,
    updateRuleBreachRequestActionMetadataRequestSchema,
    updateRuleBreachRequestBrokenRulesRequestSchema,
    getManyRuleBreachesByIds,
} from './validator.schema';

const RuleBreachRequestsRouter: Router = Router();

const controller = createController(RuleBreachRequestsController);

RuleBreachRequestsRouter.post(
    '/get-many',
    ValidateRequest(getManyRuleBreachesByIds),
    wrapController(RuleBreachRequestsController.getManyRuleBreachRequests),
);

RuleBreachRequestsRouter.post(
    '/',
    ValidateRequest(createRuleBreachRequestRequestSchema),
    wrapController(RuleBreachRequestsController.createRuleBreachRequest),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/status',
    ValidateRequest(updateRuleBreachRequestStatusRequestSchema),
    controller('updateRuleBreachRequestStatus'),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/action-metadata',
    ValidateRequest(updateRuleBreachRequestActionMetadataRequestSchema),
    wrapController(RuleBreachRequestsController.updateRuleBreachRequestActionsMetadatas),
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/broken-rules',
    ValidateRequest(updateRuleBreachRequestBrokenRulesRequestSchema),
    controller('updateRuleBreachRequestBrokenRules'),
);

RuleBreachRequestsRouter.get('/:ruleBreachRequestId', ValidateRequest(getRuleBreachRequestByIdRequestSchema), controller('getRuleBreachRequestById'));

RuleBreachRequestsRouter.get(
    '/broken-rules/:ruleId',
    ValidateRequest(getRuleBreachRequestsByRuleIdRequestSchema),
    controller('getRuleBreachRequestsByRuleId'),
);

export default RuleBreachRequestsRouter;
