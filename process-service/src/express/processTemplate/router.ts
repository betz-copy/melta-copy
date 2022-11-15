import { Router } from 'express';
import ProcessTemplate from './controller';
// import FeatureValidator from './validator';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    getTemplateByIdRequestSchema,
    updateTemplateByIdRequestSchema,
    deleteTemplateByIdRequestSchema,
    createTemplateRequestSchema,
    searchTemplateRequestSchema,
} from './validator.schema';

const processTemplateRouter: Router = Router();

processTemplateRouter.get('/:templateId', ValidateRequest(getTemplateByIdRequestSchema), wrapController(ProcessTemplate.getTemplateById));
processTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), wrapController(ProcessTemplate.createTemplate));
processTemplateRouter.delete('/:templateId', ValidateRequest(deleteTemplateByIdRequestSchema), wrapController(ProcessTemplate.deleteTemplate));
processTemplateRouter.put('/:templateId', ValidateRequest(updateTemplateByIdRequestSchema), wrapController(ProcessTemplate.updateTemplate));
processTemplateRouter.post('/search', ValidateRequest(searchTemplateRequestSchema), wrapController(ProcessTemplate.searchTemplates));
export default processTemplateRouter;
