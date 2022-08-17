import { Router } from 'express';
import RuleBreachAlertsController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createRuleBreachAlertSchema } from './validator.schema';

const RuleBreachAlertsRouter: Router = Router();

RuleBreachAlertsRouter.post('/', ValidateRequest(createRuleBreachAlertSchema), wrapController(RuleBreachAlertsController.createRuleBreachAlert));

export default RuleBreachAlertsRouter;
