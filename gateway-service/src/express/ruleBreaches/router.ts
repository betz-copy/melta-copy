import { Router } from 'express';
import multer from 'multer';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import RuleBreachesController from './controller';
import {
    approveRuleBreachRequestRequestSchema,
    cancelRuleBreachRequestRequestSchema,
    createRuleBreachRequestRequestSchema,
    denyRuleBreachRequestRequestSchema,
    getManyRuleBreachesByIds,
    getRuleBreachAlertByIdRequestSchema,
    getRuleBreachRequestByIdRequestSchema,
    searchRuleBreachAlertsRequestSchema,
    searchRuleBreachRequestsRequestSchema,
} from './validator.schema';

const RulesBreachesRouter: Router = Router();

const RulesBreachesControllerMiddleware = createWorkspacesController(RuleBreachesController);

RulesBreachesRouter.post(
    '/requests',
    multer({ dest: config.service.uploadsFolderPath }).any(),
    ValidateRequest(createRuleBreachRequestRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('createRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/get-many',
    ValidateRequest(getManyRuleBreachesByIds),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.getManyRuleBreachRequests),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/approve',
    ValidateRequest(approveRuleBreachRequestRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('approveRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/deny',
    ValidateRequest(denyRuleBreachRequestRequestSchema),
    AuthorizerControllerMiddleware('userCanWriteRules'),
    RulesBreachesControllerMiddleware('denyRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/cancel',
    ValidateRequest(cancelRuleBreachRequestRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('cancelRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/search',
    ValidateRequest(searchRuleBreachRequestsRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('searchRuleBreachRequests'),
);

RulesBreachesRouter.post(
    '/alerts/search',
    ValidateRequest(searchRuleBreachAlertsRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('searchRuleBreachAlerts'),
);

RulesBreachesRouter.get(
    '/requests/:ruleBreachRequestId',
    ValidateRequest(getRuleBreachRequestByIdRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('getRuleBreachRequestsById'),
);

RulesBreachesRouter.get(
    '/alerts/:ruleBreachAlertId',
    ValidateRequest(getRuleBreachAlertByIdRequestSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    RulesBreachesControllerMiddleware('getRuleBreachAlertsById'),
);

export default RulesBreachesRouter;
