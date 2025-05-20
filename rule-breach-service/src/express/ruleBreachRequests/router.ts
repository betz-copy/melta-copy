import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import RuleBreachRequestsController from './controller';
import {
    createRuleBreachRequestRequestSchema,
    getManyRuleBreachesByIds,
    getRuleBreachRequestByIdRequestSchema,
    getRuleBreachRequestsByRuleIdRequestSchema,
    searchRuleBreachRequestsRequestSchema,
    updateManyRuleBreachRequestsStatusesByRelatedEntityIdRequestSchema,
    updateRuleBreachRequestActionMetadataRequestSchema,
    updateRuleBreachRequestBrokenRulesRequestSchema,
    updateRuleBreachRequestStatusRequestSchema,
} from './validator.schema';

const RuleBreachRequestsRouter: Router = Router();

const controller = createController(RuleBreachRequestsController);

RuleBreachRequestsRouter.post('/search', ValidateRequest(searchRuleBreachRequestsRequestSchema), controller.searchRuleBreachRequests);

RuleBreachRequestsRouter.post('/get-many', ValidateRequest(getManyRuleBreachesByIds), controller.getManyRuleBreachRequests);

RuleBreachRequestsRouter.post('/', ValidateRequest(createRuleBreachRequestRequestSchema), controller.createRuleBreachRequest);

RuleBreachRequestsRouter.put(
    '/many/status/:entityId',
    ValidateRequest(updateManyRuleBreachRequestsStatusesByRelatedEntityIdRequestSchema),
    controller.updateManyRuleBreachRequestsStatusesByRelatedEntityId,
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/status',
    ValidateRequest(updateRuleBreachRequestStatusRequestSchema),
    controller.updateRuleBreachRequestStatus,
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/action-metadata',
    ValidateRequest(updateRuleBreachRequestActionMetadataRequestSchema),
    controller.updateRuleBreachRequestActionsMetadatas,
);

RuleBreachRequestsRouter.patch(
    '/:ruleBreachRequestId/broken-rules',
    ValidateRequest(updateRuleBreachRequestBrokenRulesRequestSchema),
    controller.updateRuleBreachRequestBrokenRules,
);

RuleBreachRequestsRouter.get('/:ruleBreachRequestId', ValidateRequest(getRuleBreachRequestByIdRequestSchema), controller.getRuleBreachRequestById);

RuleBreachRequestsRouter.get(
    '/broken-rules/:ruleId',
    ValidateRequest(getRuleBreachRequestsByRuleIdRequestSchema),
    controller.getRuleBreachRequestsByRuleId,
);

export default RuleBreachRequestsRouter;
