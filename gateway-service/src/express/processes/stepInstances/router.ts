import { Router } from 'express';
import multer from 'multer';
import config from '../../../config';
import { wrapController, wrapMulter } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import StepInstanceController from './controller';
import { updateStepSchema } from './validator.schema';

const StepInstanceRouter: Router = Router({ mergeParams: true });

StepInstanceRouter.patch(
    '/:stepId',
    wrapMulter(multer({ dest: config.service.uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any()),
    ValidateRequest(updateStepSchema),
    wrapController(StepInstanceController.updateStep),
);

export default StepInstanceRouter;
