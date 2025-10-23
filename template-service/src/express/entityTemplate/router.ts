import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import EntityTemplateController from './controller';
import {
    convertToRelationshipFieldRequestSchema,
    createEntityTemplateSchema,
    deleteEntityTemplateSchema,
    getAllTemplatesSchema,
    getEntityTemplateByIdSchema,
    getTemplatesUsingRelationshipReferenceSchema,
    searchEntityTemplatesByFormatSchema,
    searchEntityTemplatesSchema,
    updateEntityTemplateActionSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
} from './validator.schema';
import EntityTemplateValidator from './validator.template';

const entityTemplateRouter: Router = Router();

const controller = createController(EntityTemplateController);
const validatorController = createController(EntityTemplateValidator, true);

entityTemplateRouter.post('/searchByFormat', ValidateRequest(searchEntityTemplatesByFormatSchema), controller.searchEntityTemplatesIncludesFormat);

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), controller.searchEntityTemplates);

entityTemplateRouter.get('/:templateId', ValidateRequest(getEntityTemplateByIdSchema), controller.getEntityTemplateById);

entityTemplateRouter.get('/', ValidateRequest(getAllTemplatesSchema), controller.getAllTemplates);

entityTemplateRouter.get(
    '/related/:relatedTemplateId',
    ValidateRequest(getTemplatesUsingRelationshipReferenceSchema),
    controller.getTemplatesUsingRelationshipReference,
);

entityTemplateRouter.post(
    '/',
    ValidateRequest(createEntityTemplateSchema),
    validatorController.validateCreateEntityTemplate,
    controller.createEntityTemplate,
);

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
