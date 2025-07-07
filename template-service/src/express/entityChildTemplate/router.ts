import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import EntityChildTemplateController from './controller';
import {
    createEntityChildTemplateSchema,
    deleteEntityChildTemplateSchema,
    getAllChildTemplatesSchema,
    getChildTemplateByIdSchema,
    searchEntityChildTemplatesSchema,
    updateEntityChildTemplateSchema,
    updateEntityTemplateActionSchema,
} from './validator.schema';
import EntityChildTemplateValidator from './validator.template';

const entityChildTemplateRouter: Router = Router();

const controller = createController(EntityChildTemplateController);
const validatorController = createController(EntityChildTemplateValidator, true);

entityChildTemplateRouter.post('/search', ValidateRequest(searchEntityChildTemplatesSchema), controller.searchEntityChildTemplates);

entityChildTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

entityChildTemplateRouter.post('/', ValidateRequest(createEntityChildTemplateSchema), controller.createEntityChildTemplate);

entityChildTemplateRouter.get('/:id', ValidateRequest(getChildTemplateByIdSchema), controller.getChildTemplateById);

entityChildTemplateRouter.put('/:id', ValidateRequest(updateEntityChildTemplateSchema), controller.updateEntityChildTemplate);

entityChildTemplateRouter.delete('/:id', ValidateRequest(deleteEntityChildTemplateSchema), controller.deleteEntityChildTemplate);

entityChildTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

export default entityChildTemplateRouter;
