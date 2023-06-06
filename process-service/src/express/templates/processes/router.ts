import { Router } from 'express';
import ProcessTemplateController from './controller';
import { wrapController } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import {
    getTemplateByIdRequestSchema,
    updateTemplateByIdRequestSchema,
    deleteTemplateByIdRequestSchema,
    createTemplateRequestSchema,
    searchTemplateRequestSchema,
} from './validator.schema';

const processTemplateRouter: Router = Router();

processTemplateRouter.get('/:id', ValidateRequest(getTemplateByIdRequestSchema), wrapController(ProcessTemplateController.getTemplateById));
processTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), wrapController(ProcessTemplateController.createTemplate));
processTemplateRouter.delete('/:id', ValidateRequest(deleteTemplateByIdRequestSchema), wrapController(ProcessTemplateController.deleteTemplate));
processTemplateRouter.put('/:id', ValidateRequest(updateTemplateByIdRequestSchema), wrapController(ProcessTemplateController.updateTemplate));
processTemplateRouter.post('/search', ValidateRequest(searchTemplateRequestSchema), wrapController(ProcessTemplateController.searchTemplates));

export default processTemplateRouter;
