import { Router } from 'express';
import RuleBreachesController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getRuleBreachByIdSchema, searchRuleBreachesSchema, updateRuleBreachActionMetadataSchema } from './validator.schema';

const RuleBreachesRouter: Router = Router();

RuleBreachesRouter.post('/search', ValidateRequest(searchRuleBreachesSchema), wrapController(RuleBreachesController.searchRuleBreaches));

RuleBreachesRouter.patch(
    '/:ruleBreachId/action-metadata',
    ValidateRequest(updateRuleBreachActionMetadataSchema),
    wrapController(RuleBreachesController.updateRuleBreachActionMetadata),
);

RuleBreachesRouter.post('/:ruleBreachId', ValidateRequest(getRuleBreachByIdSchema), wrapController(RuleBreachesController.getRuleBreachById));

export default RuleBreachesRouter;
