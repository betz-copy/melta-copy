import { Router } from 'express';
import EntityTemplateController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    searchEntityTemplatesSchema,
    deleteEntityTemplateSchema,
    getEntityTemplateByIdSchema,
    createEntityTemplateSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
    updateEntityTemplateActionSchema,
    getTemplatesUsingRelationshipReferanceSchema,
} from './validator.schema';
import { validateActionAst } from './validator.template';

const entityTemplateRouter: Router = Router();

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), wrapController(EntityTemplateController.searchEntityTemplates));

entityTemplateRouter.get(
    '/:templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    wrapController(EntityTemplateController.getEntityTemplateById),
);

entityTemplateRouter.get(
    '/related/:relatedTemplateId',
    ValidateRequest(getTemplatesUsingRelationshipReferanceSchema),
    wrapController(EntityTemplateController.getTemplatesUsingRelationshipReferance),
);

entityTemplateRouter.post('/', ValidateRequest(createEntityTemplateSchema), wrapController(EntityTemplateController.createEntityTemplate));

entityTemplateRouter.delete(
    '/:templateId',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapController(EntityTemplateController.deleteEntityTemplate),
);

entityTemplateRouter.put('/:templateId', ValidateRequest(updateEntityTemplateSchema), wrapController(EntityTemplateController.updateEntityTemplate));

entityTemplateRouter.patch(
    '/:templateId/actions',
    ValidateRequest(updateEntityTemplateActionSchema),
    wrapMiddleware(validateActionAst),
    wrapController(EntityTemplateController.updateEntityTemplateAction),
);

entityTemplateRouter.patch(
    '/:templateId/status',
    ValidateRequest(updateEntityTemplateStatusSchema),
    wrapController(EntityTemplateController.updateEntityTemplateStatus),
);

export default entityTemplateRouter;
