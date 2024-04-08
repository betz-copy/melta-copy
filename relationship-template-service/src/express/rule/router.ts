import { Router } from 'express';
import RuleController from './controller';
import { wrapController, wrapValidator } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    getRuleByIdRequestSchema,
    updateRuleByIdRequestSchema,
    updateRuleStatusByIdRequestSchema,
    deleteRuleByIdRequestSchema,
    createRuleRequestSchema,
    searchRulesRequestSchema,
} from './validator.schema';
import { validateRuleFormulaMiddleware } from './validator';

const RuleRouter: Router = Router();

RuleRouter.get('/:ruleId', ValidateRequest(getRuleByIdRequestSchema), wrapController(RuleController.getRuleById));
RuleRouter.put('/:ruleId', ValidateRequest(updateRuleByIdRequestSchema), wrapController(RuleController.updateRuleById));
RuleRouter.patch('/:ruleId/status', ValidateRequest(updateRuleStatusByIdRequestSchema), wrapController(RuleController.updateRuleStatusById));
RuleRouter.delete('/:ruleId', ValidateRequest(deleteRuleByIdRequestSchema), wrapController(RuleController.deleteRuleById));
RuleRouter.post(
    '/',
    ValidateRequest(createRuleRequestSchema),
    wrapValidator(validateRuleFormulaMiddleware),
    wrapController(RuleController.createRule),
);
RuleRouter.post('/search', ValidateRequest(searchRulesRequestSchema), wrapController(RuleController.searchRules));
RuleRouter.post('/isPropertyOfTemplateInUsed/:entityId', wrapController(RuleController.isPropertyOfTemplateInUsed));

export default RuleRouter;
