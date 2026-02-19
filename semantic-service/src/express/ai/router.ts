import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import config from '../../config';
import { fileUploadMiddleware } from '../../utils/multer';
import SemanticController from './controller';
import { summarizeRequestSchema } from './validator.schema';

const { maxUploadFiles } = config.service;

const semanticRouter: Router = Router();

semanticRouter.post(
    '/summarize',
    fileUploadMiddleware().array('files', maxUploadFiles),
    ValidateRequest(summarizeRequestSchema),
    wrapController(SemanticController.summarize),
);

export default semanticRouter;
