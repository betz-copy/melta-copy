import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import StepInstanceController from './controller';
import { updateStepSchema } from './validator.schema';
import busboyMiddleware from '../../../utils/busboy/busboyMiddleware';

const StepInstanceRouter: Router = Router({ mergeParams: true });

const StepInstanceControllerMiddleware = createController(StepInstanceController);

StepInstanceRouter.patch('/:stepId', busboyMiddleware, ValidateRequest(updateStepSchema), StepInstanceControllerMiddleware.updateStep);

export default StepInstanceRouter;
