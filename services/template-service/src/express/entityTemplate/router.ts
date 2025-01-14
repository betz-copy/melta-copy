import { Router } from 'express';
import { createController } from '@microservices/shared';
import ValidateRequest from '../../utils/joi';
import EntityTemplateController from './controller';
import {
    convertToRelationshipFieldRequestSchema,
    createEntityTemplateSchema,
    deleteEntityTemplateSchema,
    getEntityTemplateByIdSchema,
    getTemplatesUsingRelationshipReferanceSchema,
    searchEntityTemplatesSchema,
    updateEntityTemplateActionSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
} from './validator.schema';
import EntityTemplateValidator from './validator.template';

const entityTemplateRouter: Router = Router();

const controller = createController(EntityTemplateController);
const validatorController = createController(EntityTemplateValidator, true);

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), controller.searchEntityTemplates);

entityTemplateRouter.get('/:templateId', ValidateRequest(getEntityTemplateByIdSchema), controller.getEntityTemplateById);

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

entityTemplateRouter.put(
    '/convertToRelationshipField/:templateId/:relationshipTemplateId',
    ValidateRequest(convertToRelationshipFieldRequestSchema),
    controller.convertToRelationshipField,
);

entityTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    validatorController.validateActionCode,
    controller.updateEntityTemplateAction,
);

entityTemplateRouter.patch('/:templateId/status', ValidateRequest(updateEntityTemplateStatusSchema), controller.updateEntityTemplateStatus);

export default entityTemplateRouter;
