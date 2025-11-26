import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import busboyMiddleware from '../../../utils/busboy/busboyMiddleware';
import StepInstanceController from './controller';
import { updateStepSchema } from './validator.schema';

const StepInstanceRouter: Router = Router({ mergeParams: true });

const StepInstanceControllerMiddleware = createController(StepInstanceController);

StepInstanceRouter.patch('/:stepId', busboyMiddleware, ValidateRequest(updateStepSchema), StepInstanceControllerMiddleware.updateStep);

export default StepInstanceRouter;
