import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import ProcessTemplatesController from './controller';
import {
    createProcessTemplateSchema,
    deleteProcessTemplateSchema,
    updateProcessTemplateSchema,
    getTemplateByIdSchema,
    searchProcessTemplatesSchema,
} from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../../utils/authorizer';
import busboyMiddleware from '../../../utils/busboy/busboyMiddleware';

const TemplatesRouter: Router = Router();

const TemplatesControllerMiddleware = createController(ProcessTemplatesController);

TemplatesRouter.get(
    '/:id',
    ValidateRequest(getTemplateByIdSchema),
    AuthorizerControllerMiddleware.userCanReadProcesses,
    TemplatesControllerMiddleware.getTemplateById,
);
TemplatesRouter.post(
    '/',
    busboyMiddleware,
    ValidateRequest(createProcessTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    TemplatesControllerMiddleware.createProcessTemplate,
);
TemplatesRouter.post('/search', ValidateRequest(searchProcessTemplatesSchema), TemplatesControllerMiddleware.searchProcessTemplates);
TemplatesRouter.delete(
    '/:id',
    ValidateRequest(deleteProcessTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    TemplatesControllerMiddleware.deleteProcessTemplate,
);
TemplatesRouter.put(
    '/:id',
    busboyMiddleware,
    ValidateRequest(updateProcessTemplateSchema),
    AuthorizerControllerMiddleware.userCanWriteProcesses,
    TemplatesControllerMiddleware.updateProcessTemplate,
);

export default TemplatesRouter;
