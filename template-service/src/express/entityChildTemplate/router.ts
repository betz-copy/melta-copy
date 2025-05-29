import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import EntityChildTemplateController from './controller';
import {
    searchEntityChildTemplatesSchema,
    getAllChildTemplatesSchema,
    createEntityChildTemplateSchema,
    getChildTemplateByIdSchema,
    updateEntityChildTemplateSchema,
    deleteEntityChildTemplateSchema,
} from './validator.schema';

const entityChildTemplateRouter: Router = Router();

const controller = createController(EntityChildTemplateController);

entityChildTemplateRouter.post('/search', ValidateRequest(searchEntityChildTemplatesSchema), controller.searchEntityChildTemplates);

entityChildTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

entityChildTemplateRouter.post('/', ValidateRequest(createEntityChildTemplateSchema), controller.createEntityChildTemplate);

entityChildTemplateRouter.get('/:id', ValidateRequest(getChildTemplateByIdSchema), controller.getChildTemplateById);

entityChildTemplateRouter.put('/:id', ValidateRequest(updateEntityChildTemplateSchema), controller.updateEntityChildTemplate);

entityChildTemplateRouter.delete('/:id', ValidateRequest(deleteEntityChildTemplateSchema), controller.deleteEntityChildTemplate);

export default entityChildTemplateRouter;
