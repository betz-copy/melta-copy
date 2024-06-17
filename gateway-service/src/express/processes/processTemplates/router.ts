import { Router } from 'express';
import multer from 'multer';
import { createWorkspacesController, wrapMiddleware } from '../../../utils/express';
import ProcessTemplatesController from './controller';
import config from '../../../config';
import ValidateRequest from '../../../utils/joi';
import {
    createProcessTemplateSchema,
    deleteProcessTemplateSchema,
    updateProcessTemplateSchema,
    getTemplateByIdSchema,
    searchProcessTemplatesSchema,
} from './validator.schema';
import { validateUserIsProcessesManager } from '../../permissions/validateAuthorizationMiddleware';

const {
    service: { uploadsFolderPath },
} = config;

const TemplatesRouter: Router = Router();

const TemplatesControllerMiddleware = createWorkspacesController(ProcessTemplatesController);

// TODO add validate User Is Processes Manager
TemplatesRouter.get('/:id', ValidateRequest(getTemplateByIdSchema), TemplatesControllerMiddleware('getTemplateById'));
TemplatesRouter.post(
    '/',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    TemplatesControllerMiddleware('createProcessTemplate'),
);
TemplatesRouter.post('/search', ValidateRequest(searchProcessTemplatesSchema), TemplatesControllerMiddleware('searchProcessTemplates'));
TemplatesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    TemplatesControllerMiddleware('deleteProcessTemplate'),
);
TemplatesRouter.put(
    '/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    TemplatesControllerMiddleware('updateProcessTemplate'),
);

export default TemplatesRouter;
