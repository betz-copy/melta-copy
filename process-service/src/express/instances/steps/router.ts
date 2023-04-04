import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import { updateStepPropertiesSchema, updateStepStatusSchema } from './validator.schema';
import StepInstanceController from './controller';
import validateStepInstance from './validator.template';

const StepInstanceRouter: Router = Router();

StepInstanceRouter.patch(
    '/:id/properties',
    ValidateRequest(updateStepPropertiesSchema),
    wrapMiddleware(validateStepInstance),
    wrapController(StepInstanceController.updateStepProperties),
);
StepInstanceRouter.patch('/:id/status', ValidateRequest(updateStepStatusSchema), wrapController(StepInstanceController.updateStepStatus));

export default StepInstanceRouter;
