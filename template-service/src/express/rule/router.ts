import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import RuleController from './controller';
import { RuleValidator } from './validator';
import {
    createRuleRequestSchema,
    deleteRuleByIdRequestSchema,
    getRuleByIdRequestSchema,
    searchRulesRequestSchema,
    updateRuleByIdRequestSchema,
    updateRuleStatusByIdRequestSchema,
    deleteRuleByIdRequestSchema,
    createRuleRequestSchema,
    searchRulesRequestSchema,
    getManyRulesByIdsRequestSchema,
} from './validator.schema';

const RuleRouter: Router = Router();

RuleRouter.get('/:ruleId', ValidateRequest(getRuleByIdRequestSchema), wrapController(RuleController.getRuleById));
RuleRouter.post('/get-many', ValidateRequest(getManyRulesByIdsRequestSchema), wrapController(RuleController.getManyRulesByIds));
RuleRouter.put('/:ruleId', ValidateRequest(updateRuleByIdRequestSchema), wrapController(RuleController.updateRuleById));
RuleRouter.patch('/:ruleId/status', ValidateRequest(updateRuleStatusByIdRequestSchema), wrapController(RuleController.updateRuleStatusById));
RuleRouter.delete('/:ruleId', ValidateRequest(deleteRuleByIdRequestSchema), wrapController(RuleController.deleteRuleById));
RuleRouter.post(
    '/',
    ValidateRequest(createRuleRequestSchema),
    validateRuleFormulaController('validateRuleFormulaMiddleware'),
    controller('createRule'),
);
RuleRouter.post('/search', ValidateRequest(searchRulesRequestSchema), controller('searchRules'));

export default RuleRouter;
