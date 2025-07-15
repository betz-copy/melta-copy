import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import ChildTemplateController from './controller';
import {
    createChildTemplateSchema,
    deleteChildTemplateSchema,
    getAllChildTemplatesSchema,
    getChildTemplateByIdSchema,
    searchChildTemplatesSchema,
    updateChildTemplateSchema,
    updateEntityTemplateActionSchema,
} from './validator.schema';
import ChildTemplateValidator from './validator.template';

const entityChildTemplateRouter: Router = Router();

const controller = createController(ChildTemplateController);
const validatorController = createController(ChildTemplateValidator, true);

entityChildTemplateRouter.post('/search', ValidateRequest(searchChildTemplatesSchema), controller.searchChildTemplates);

entityChildTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

entityChildTemplateRouter.post('/', ValidateRequest(createChildTemplateSchema), controller.createChildTemplate);

entityChildTemplateRouter.get('/:id', ValidateRequest(getChildTemplateByIdSchema), controller.getChildTemplateById);

entityChildTemplateRouter.put('/:id', ValidateRequest(updateChildTemplateSchema), controller.updateChildTemplate);

entityChildTemplateRouter.delete('/:id', ValidateRequest(deleteChildTemplateSchema), controller.deleteChildTemplate);

entityChildTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

export default entityChildTemplateRouter;
