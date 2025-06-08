import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import EntityChildTemplateController from './controller';
import {
    searchEntityChildTemplatesSchema,
    getAllChildTemplatesSchema,
    createEntityChildTemplateSchema,
    updateEntityChildTemplateSchema,
    deleteEntityChildTemplateSchema,
    updateEntityTemplateActionSchema,
    getEntityChildTemplateByIdSchema,
} from './validator.schema';
import EntityChildTemplateValidator from './validatior.template';

const entityChildTemplateRouter: Router = Router();

const controller = createController(EntityChildTemplateController);
const validatorController = createController(EntityChildTemplateValidator, true);

entityChildTemplateRouter.post('/search', ValidateRequest(searchEntityChildTemplatesSchema), controller.searchEntityChildTemplates);

entityChildTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

entityChildTemplateRouter.get('/:id', ValidateRequest(getEntityChildTemplateByIdSchema), controller.getEntityChildTemplateById);

entityChildTemplateRouter.post('/', ValidateRequest(createEntityChildTemplateSchema), controller.createEntityChildTemplate);

entityChildTemplateRouter.put('/:id', ValidateRequest(updateEntityChildTemplateSchema), controller.updateEntityChildTemplate);

entityChildTemplateRouter.delete('/:id', ValidateRequest(deleteEntityChildTemplateSchema), controller.deleteEntityChildTemplate);

entityChildTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

export default entityChildTemplateRouter;
