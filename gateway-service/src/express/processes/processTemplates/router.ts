import { Router } from 'express';
import * as multer from 'multer';
import { wrapController, wrapMiddleware } from '../../../utils/express';
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

// TODO add validate User Is Processes Manager
TemplatesRouter.get('/:id', ValidateRequest(getTemplateByIdSchema), wrapController(ProcessTemplatesController.getTemplateById));
TemplatesRouter.post(
    '/',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(createProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(ProcessTemplatesController.createProcessTemplate),
);
TemplatesRouter.post('/search', ValidateRequest(searchProcessTemplatesSchema), wrapController(ProcessTemplatesController.searchProcessTemplates));
TemplatesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(ProcessTemplatesController.deleteProcessTemplate),
);
TemplatesRouter.put(
    '/:id',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(),
    ValidateRequest(updateProcessTemplateSchema),
    wrapMiddleware(validateUserIsProcessesManager),
    wrapController(ProcessTemplatesController.updateProcessTemplate),
);

export default TemplatesRouter;
