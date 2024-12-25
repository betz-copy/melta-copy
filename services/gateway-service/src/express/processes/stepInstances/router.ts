import { Router } from 'express';
import multer from 'multer';
import { createController } from '@microservices/shared';
import config from '../../../config';
import { wrapMulter } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import StepInstanceController from './controller';
import { updateStepSchema } from './validator.schema';

const StepInstanceRouter: Router = Router({ mergeParams: true });

const StepInstanceControllerMiddleware = createController(StepInstanceController);

StepInstanceRouter.patch(
    '/:stepId',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(updateStepSchema),
    StepInstanceControllerMiddleware.updateStep,
);

export default StepInstanceRouter;
