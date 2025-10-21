import { createController, ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import ChildTemplateController from './controller';
import {
    createChildTemplateSchema,
    deleteChildTemplateSchema,
    getAllChildTemplatesSchema,
    getChildTemplateByIdSchema,
    multiUpdateChildTemplateStatusByParentIdSchema,
    searchChildTemplatesSchema,
    updateChildTemplateSchema,
    updateChildTemplateStatusSchema,
    updateEntityTemplateActionSchema,
} from './validator.schema';
import ChildTemplateValidator from './validator.template';

const childTemplateRouter: Router = Router();

const controller = createController(ChildTemplateController);
const validatorController = createController(ChildTemplateValidator, true);

childTemplateRouter.post('/search', ValidateRequest(searchChildTemplatesSchema), controller.searchChildTemplates);

childTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

childTemplateRouter.post('/', ValidateRequest(createChildTemplateSchema), controller.createChildTemplate);

childTemplateRouter.get('/:id', ValidateRequest(getChildTemplateByIdSchema), controller.getChildTemplateById);

childTemplateRouter.put('/:id', ValidateRequest(updateChildTemplateSchema), controller.updateChildTemplate);

childTemplateRouter.delete('/:id', ValidateRequest(deleteChildTemplateSchema), controller.deleteChildTemplate);

childTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

childTemplateRouter.patch('/:templateId/status', ValidateRequest(updateChildTemplateStatusSchema), controller.updateChildTemplateStatus);

childTemplateRouter.patch(
    '/:parentId/multiStatuses',
    ValidateRequest(multiUpdateChildTemplateStatusByParentIdSchema),
    controller.multiUpdateChildTemplateStatusByParentId,
);

export default childTemplateRouter;
