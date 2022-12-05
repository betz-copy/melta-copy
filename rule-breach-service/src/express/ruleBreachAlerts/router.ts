import { Router } from 'express';
import RuleBreachAlertsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createRuleBreachAlertRequestSchema,
    getRuleBreachAlertByIdRequestSchema,
    getRuleBreachAlertsByRuleIdRequestSchema,
    searchRuleBreachAlertsRequestSchema,
} from './validator.schema';

const RuleBreachAlertsRouter: Router = Router();

RuleBreachAlertsRouter.post(
    '/search',
    ValidateRequest(searchRuleBreachAlertsRequestSchema),
    wrapController(RuleBreachAlertsController.searchRuleBreachAlerts),
);

RuleBreachAlertsRouter.post(
    '/',
    ValidateRequest(createRuleBreachAlertRequestSchema),
    wrapController(RuleBreachAlertsController.createRuleBreachAlert),
);

RuleBreachAlertsRouter.get(
    '/:ruleBreachAlertId',
    ValidateRequest(getRuleBreachAlertByIdRequestSchema),
    wrapController(RuleBreachAlertsController.getRuleBreachAlertById),
);

RuleBreachAlertsRouter.get(
    '/broken-rules/:ruleId',
    ValidateRequest(getRuleBreachAlertsByRuleIdRequestSchema),
    wrapController(RuleBreachAlertsController.getRuleBreachAlertsByRuleId),
);

export default RuleBreachAlertsRouter;
