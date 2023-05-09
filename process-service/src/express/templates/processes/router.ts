import { Router } from 'express';
import ProcessTemplate from './controller';
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

// TODO add permission checking
processTemplateRouter.get('/all', wrapController(ProcessTemplate.getAllTemplates));
processTemplateRouter.get('/:id', ValidateRequest(getTemplateByIdRequestSchema), wrapController(ProcessTemplate.getTemplateById));
processTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), wrapController(ProcessTemplate.createTemplate));
processTemplateRouter.delete('/:id', ValidateRequest(deleteTemplateByIdRequestSchema), wrapController(ProcessTemplate.deleteTemplate));
processTemplateRouter.put('/:id', ValidateRequest(updateTemplateByIdRequestSchema), wrapController(ProcessTemplate.updateTemplate));
processTemplateRouter.post('/search', ValidateRequest(searchTemplateRequestSchema), wrapController(ProcessTemplate.searchTemplates));

export default processTemplateRouter;
