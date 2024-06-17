import { Router } from 'express';
import multer = require('multer');
import config from '../../config';
import { createWorkspacesController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateUserHasAtLeastSomePermissions, validateUserIsRulesManager } from '../permissions/validateAuthorizationMiddleware';
import RuleBreachesController from './controller';
import {
    approveRuleBreachRequestRequestSchema,
    cancelRuleBreachRequestRequestSchema,
    createRuleBreachRequestRequestSchema,
    denyRuleBreachRequestRequestSchema,
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
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('createRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/approve',
    ValidateRequest(approveRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserIsRulesManager),
    RulesBreachesControllerMiddleware('approveRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/deny',
    ValidateRequest(denyRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserIsRulesManager),
    RulesBreachesControllerMiddleware('denyRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/cancel',
    ValidateRequest(cancelRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('cancelRuleBreachRequest'),
);

RulesBreachesRouter.post(
    '/requests/search',
    ValidateRequest(searchRuleBreachRequestsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('searchRuleBreachRequests'),
);

RulesBreachesRouter.post(
    '/alerts/search',
    ValidateRequest(searchRuleBreachAlertsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('searchRuleBreachAlerts'),
);

RulesBreachesRouter.get(
    '/requests/:ruleBreachRequestId',
    ValidateRequest(getRuleBreachRequestByIdRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('getRuleBreachRequestsById'),
);

RulesBreachesRouter.get(
    '/alerts/:ruleBreachAlertId',
    ValidateRequest(getRuleBreachAlertByIdRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    RulesBreachesControllerMiddleware('getRuleBreachAlertsById'),
);

export default RulesBreachesRouter;
