import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import { AuthorizerControllerMiddleware } from '../../../utils/authorizer';
import busboyMiddleware from '../../../utils/busboy/busboyMiddleware';
import ProcessTemplatesController from './controller';
import {
    createProcessTemplateSchema,
    deleteProcessTemplateSchema,
    getTemplateByIdSchema,
    searchProcessTemplatesSchema,
    updateProcessTemplateSchema,
} from './validator.schema';

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
