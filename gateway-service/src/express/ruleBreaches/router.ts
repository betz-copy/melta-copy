import { Router } from 'express';
import multer = require('multer');
import config from '../../config';
import { wrapController, wrapMiddleware } from '../../utils/express';
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

RulesBreachesRouter.post(
    '/requests',
    multer({ dest: config.service.uploadsFolderPath }).any(),
    ValidateRequest(createRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.createRuleBreachRequest),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/approve',
    ValidateRequest(approveRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserIsRulesManager),
    wrapController(RuleBreachesController.approveRuleBreachRequest),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/deny',
    ValidateRequest(denyRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserIsRulesManager),
    wrapController(RuleBreachesController.denyRuleBreachRequest),
);

RulesBreachesRouter.post(
    '/requests/:ruleBreachRequestId/cancel',
    ValidateRequest(cancelRuleBreachRequestRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.cancelRuleBreachRequest),
);

RulesBreachesRouter.post(
    '/requests/search',
    ValidateRequest(searchRuleBreachRequestsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.searchRuleBreachRequests),
);

RulesBreachesRouter.post(
    '/alerts/search',
    ValidateRequest(searchRuleBreachAlertsRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.searchRuleBreachAlerts),
);

RulesBreachesRouter.get(
    '/requests/:ruleBreachRequestId',
    ValidateRequest(getRuleBreachRequestByIdRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.getRuleBreachRequestById),
);

RulesBreachesRouter.get(
    '/alerts/:ruleBreachAlertId',
    ValidateRequest(getRuleBreachAlertByIdRequestSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(RuleBreachesController.getRuleBreachAlertById),
);

export default RulesBreachesRouter;
