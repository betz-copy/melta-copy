import { createController, ValidateRequest } from '@packages/utils';
import { Router } from 'express';
import ProcessTemplateController from './controller';
import {
    createTemplateRequestSchema,
    deleteTemplateByIdRequestSchema,
    getTemplateByIdRequestSchema,
    searchTemplateRequestSchema,
} from './validator.schema';

const processTemplateRouter: Router = Router();

const controller = createController(ProcessTemplateController);

processTemplateRouter.get('/:id', ValidateRequest(getTemplateByIdRequestSchema), controller.getTemplateById);
processTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), controller.createTemplate);
processTemplateRouter.delete('/:id', ValidateRequest(deleteTemplateByIdRequestSchema), controller.deleteTemplate);
processTemplateRouter.post('/search', ValidateRequest(searchTemplateRequestSchema), controller.searchTemplates);

export default processTemplateRouter;
