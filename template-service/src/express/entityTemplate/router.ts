import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import EntityTemplateController from './controller';
import {
    createEntityTemplateSchema,
    deleteEntityTemplateSchema,
    getAllTemplatesSchema,
    getEntityTemplateByIdSchema,
    getTemplatesUsingRelationshipReferanceSchema,
    searchEntityTemplatesSchema,
    updateEntityTemplateActionSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
} from './validator.schema';
import { EntityTemplateValidator } from './validator.template';

const entityTemplateRouter: Router = Router();

const controller = createController(EntityTemplateController);
const validatorController = createController(EntityTemplateValidator, true);

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), controller.searchEntityTemplates);

entityTemplateRouter.get('/:templateId', ValidateRequest(getEntityTemplateByIdSchema), controller.getEntityTemplateById);

entityTemplateRouter.get('/', ValidateRequest(getAllTemplatesSchema), controller.getAllTemplates);

entityTemplateRouter.get(
    '/related/:relatedTemplateId',
    ValidateRequest(getTemplatesUsingRelationshipReferanceSchema),
    controller.getTemplatesUsingRelationshipReferance,
);

entityTemplateRouter.post('/', ValidateRequest(createEntityTemplateSchema), controller.createEntityTemplate);

entityTemplateRouter.delete('/:templateId', ValidateRequest(deleteEntityTemplateSchema), controller.deleteEntityTemplate);

entityTemplateRouter.put(
    '/:templateId',
    ValidateRequest(updateEntityTemplateSchema),
    validatorController.validateEntityTemplateUpdate,
    controller.updateEntityTemplate,
);

entityTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

entityTemplateRouter.patch('/:templateId/status', ValidateRequest(updateEntityTemplateStatusSchema), controller.updateEntityTemplateStatus);

export default entityTemplateRouter;
