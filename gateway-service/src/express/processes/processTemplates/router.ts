import { Router } from 'express';
import multer from 'multer';
import { createWorkspacesController } from '../../../utils/express';
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
import { AuthorizerControllerMiddleware } from '../../../utils/authorizer';

const {
    service: { uploadsFolderPath },
} = config;

const TemplatesRouter: Router = Router();

const TemplatesControllerMiddleware = createWorkspacesController(ProcessTemplatesController);

TemplatesRouter.get(
    '/:id',
    ValidateRequest(getTemplateByIdSchema),
    AuthorizerControllerMiddleware('userCanReadProcesses'),
    TemplatesControllerMiddleware('getTemplateById'),
);
TemplatesRouter.post(
    '/',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createProcessTemplateSchema),
    AuthorizerControllerMiddleware('userCanWriteProcesses'),
    TemplatesControllerMiddleware('createProcessTemplate'),
);
TemplatesRouter.post('/search', ValidateRequest(searchProcessTemplatesSchema), TemplatesControllerMiddleware('searchProcessTemplates'));
TemplatesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessTemplateSchema),
    AuthorizerControllerMiddleware('userCanWriteProcesses'),
    TemplatesControllerMiddleware('deleteProcessTemplate'),
);
TemplatesRouter.put(
    '/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateProcessTemplateSchema),
    AuthorizerControllerMiddleware('userCanWriteProcesses'),
    TemplatesControllerMiddleware('updateProcessTemplate'),
);

export default TemplatesRouter;
