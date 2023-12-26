import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import { getStepByIdRequestSchema, getTemplateByInstanceIdRequestSchema, updateStepSchema } from './validator.schema';
import StepInstanceController from './controller';
import validateStepInstance from './validator.template';

const StepInstanceRouter: Router = Router();

StepInstanceRouter.get('/:id', ValidateRequest(getStepByIdRequestSchema), wrapController(StepInstanceController.getStepById));
StepInstanceRouter.get(
    '/:id/step-template',
    ValidateRequest(getTemplateByInstanceIdRequestSchema),
    wrapController(StepInstanceController.getStepTemplateByStepInstanceId),
);

StepInstanceRouter.patch(
    '/:id',
    ValidateRequest(updateStepSchema),
    wrapMiddleware(validateStepInstance),
    wrapController(StepInstanceController.updateStep),
);

export default StepInstanceRouter;
