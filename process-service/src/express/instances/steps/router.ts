import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import StepInstanceController from './controller';
import { getStepByIdRequestSchema, getTemplateByInstanceIdRequestSchema, updateStepSchema } from './validator.schema';
import StepInstanceValidator from './validator.template';

const StepInstanceRouter: Router = Router();

const stepInstanceController = createController(StepInstanceController);
const stepInstanceValidatorController = createController(StepInstanceValidator, true);

StepInstanceRouter.get('/:id', ValidateRequest(getStepByIdRequestSchema), stepInstanceController.getStepById);
StepInstanceRouter.get(
    '/:id/step-template',
    ValidateRequest(getTemplateByInstanceIdRequestSchema),
    stepInstanceController.getStepTemplateByStepInstanceId,
);

StepInstanceRouter.patch(
    '/:id',
    ValidateRequest(updateStepSchema),
    stepInstanceValidatorController.validateStepInstance,
    stepInstanceController.updateStep,
);

export default StepInstanceRouter;
