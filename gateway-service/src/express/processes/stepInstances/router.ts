import { Router } from 'express';
import { createWorkspacesController } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import StepInstanceController from './controller';
import { updateStepSchema } from './validator.schema';
import { busboyMiddleware } from '../../../utils/busboy/busboyMiddleware';

const StepInstanceRouter: Router = Router({ mergeParams: true });

const StepInstanceControllerMiddleware = createWorkspacesController(StepInstanceController);

StepInstanceRouter.patch('/:stepId', busboyMiddleware, ValidateRequest(updateStepSchema), StepInstanceControllerMiddleware.updateStep);

export default StepInstanceRouter;
