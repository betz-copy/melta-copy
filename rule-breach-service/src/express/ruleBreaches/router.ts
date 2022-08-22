import { Router } from 'express';
import RuleBreachesController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { searchRuleBreachesSchema } from './validator.schema';

const RuleBreachesRouter: Router = Router();

RuleBreachesRouter.post('/search', ValidateRequest(searchRuleBreachesSchema), wrapController(RuleBreachesController.searchRuleBreaches));

export default RuleBreachesRouter;
