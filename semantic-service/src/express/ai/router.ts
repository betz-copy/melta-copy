import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import config from '../../config';
import { createFileUploadMiddleware } from '../../utils/multer';
import SemanticController from './controller';
import { summarizeRequestSchema } from './validator.schema';

const { maxUploadFiles } = config.service;
const upload = createFileUploadMiddleware();

const semanticRouter: Router = Router();

semanticRouter.post(
    '/summarize',
    upload.array('files', maxUploadFiles),
    ValidateRequest(summarizeRequestSchema),
    wrapController(SemanticController.summarize),
);

export default semanticRouter;
