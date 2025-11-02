import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import RuleBreachAlertsController from './controller';
import {
    createRuleBreachAlertRequestSchema,
    getRuleBreachAlertByIdRequestSchema,
    getRuleBreachAlertsByRuleIdRequestSchema,
    searchRuleBreachAlertsRequestSchema,
} from './validator.schema';

const RuleBreachAlertsRouter: Router = Router();

const controller = createController(RuleBreachAlertsController);

RuleBreachAlertsRouter.post('/search', ValidateRequest(searchRuleBreachAlertsRequestSchema), controller.searchRuleBreachAlerts);

RuleBreachAlertsRouter.post('/', ValidateRequest(createRuleBreachAlertRequestSchema), controller.createRuleBreachAlert);

RuleBreachAlertsRouter.get('/:ruleBreachAlertId', ValidateRequest(getRuleBreachAlertByIdRequestSchema), controller.getRuleBreachAlertById);

RuleBreachAlertsRouter.get(
    '/broken-rules/:ruleId',
    ValidateRequest(getRuleBreachAlertsByRuleIdRequestSchema),
    controller.getRuleBreachAlertsByRuleId,
);

export default RuleBreachAlertsRouter;
