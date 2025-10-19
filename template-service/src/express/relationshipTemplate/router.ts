import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import RelationshipTemplateController from './controller';
import {
    createTemplateRequestSchema,
    deleteTemplateByIdRequestSchema,
    getTemplateByIdRequestSchema,
    searchTemplatesRequestSchema,
    updateTemplateByIdRequestSchema,
} from './validator.schema';

const relationshipTemplateRouter: Router = Router();

const controller = createController(RelationshipTemplateController);

relationshipTemplateRouter.get('/:templateId', ValidateRequest(getTemplateByIdRequestSchema), controller.getTemplateById);
relationshipTemplateRouter.put('/:templateId', ValidateRequest(updateTemplateByIdRequestSchema), controller.updateTemplateById);
relationshipTemplateRouter.delete('/:templateId', ValidateRequest(deleteTemplateByIdRequestSchema), controller.deleteTemplateById);
relationshipTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), controller.createTemplate);
relationshipTemplateRouter.post('/search', ValidateRequest(searchTemplatesRequestSchema), controller.searchTemplates);

export default relationshipTemplateRouter;
