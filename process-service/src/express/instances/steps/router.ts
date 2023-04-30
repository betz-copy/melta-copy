import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import {
    getStepByIdRequestSchema,
    getTemplateByInstanceIdRequestSchema,
    updateStepPropertiesSchema,
    updateStepStatusSchema,
} from './validator.schema';
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
    '/:id/properties',
    ValidateRequest(updateStepPropertiesSchema),
    wrapMiddleware(validateStepInstance),
    wrapController(StepInstanceController.updateStepProperties),
);

StepInstanceRouter.patch('/:id/status', ValidateRequest(updateStepStatusSchema), wrapController(StepInstanceController.updateStepStatus));

export default StepInstanceRouter;
