import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import RuleController from './controller';
import RuleValidator from './validator';
import {
    createRuleRequestSchema,
    deleteRuleByIdRequestSchema,
    getManyRulesByIdsRequestSchema,
    getRuleByIdRequestSchema,
    searchRulesRequestSchema,
    updateRuleByIdRequestSchema,
    updateRuleStatusByIdRequestSchema,
} from './validator.schema';

const RuleRouter: Router = Router();
const controller = createController(RuleController);
const validateRuleFormulaController = createController(RuleValidator, true);

RuleRouter.get('/:ruleId', ValidateRequest(getRuleByIdRequestSchema), controller.getRuleById);
RuleRouter.post('/get-many', ValidateRequest(getManyRulesByIdsRequestSchema), controller.getManyRulesByIds);
RuleRouter.put('/:ruleId', ValidateRequest(updateRuleByIdRequestSchema), controller.updateRuleById);
RuleRouter.patch('/:ruleId/status', ValidateRequest(updateRuleStatusByIdRequestSchema), controller.updateRuleStatusById);
RuleRouter.delete('/:ruleId', ValidateRequest(deleteRuleByIdRequestSchema), controller.deleteRuleById);
RuleRouter.post('/', ValidateRequest(createRuleRequestSchema), validateRuleFormulaController.validateRuleFormulaMiddleware, controller.createRule);
RuleRouter.post('/search', ValidateRequest(searchRulesRequestSchema), controller.searchRules);

export default RuleRouter;
