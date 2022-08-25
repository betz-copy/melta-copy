import { Router } from 'express';
import RuleBreachAlertsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createRuleBreachAlertRequestSchema,
    getRuleBreachAlertByIdRequestSchema,
    searchRuleBreachAlertsRequestSchema,
    updateRuleBreachAlertActionMetadataRequestSchema,
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

RuleBreachAlertsRouter.patch(
    '/:ruleBreachAlertId/action-metadata',
    ValidateRequest(updateRuleBreachAlertActionMetadataRequestSchema),
    wrapController(RuleBreachAlertsController.updateRuleBreachAlertActionMetadata),
);

RuleBreachAlertsRouter.get(
    '/:ruleBreachAlertId',
    ValidateRequest(getRuleBreachAlertByIdRequestSchema),
    wrapController(RuleBreachAlertsController.getRuleBreachAlertById),
);

export default RuleBreachAlertsRouter;
