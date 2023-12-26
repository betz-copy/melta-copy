import { Router } from 'express';
import RelationshipTemplateController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    getTemplateByIdRequestSchema,
    updateTemplateByIdRequestSchema,
    deleteTemplateByIdRequestSchema,
    createTemplateRequestSchema,
    searchTemplatesRequestSchema,
} from './validator.schema';

const relationshipTemplateRouter: Router = Router();

relationshipTemplateRouter.get(
    '/:templateId',
    ValidateRequest(getTemplateByIdRequestSchema),
    wrapController(RelationshipTemplateController.getTemplateById),
);
relationshipTemplateRouter.put(
    '/:templateId',
    ValidateRequest(updateTemplateByIdRequestSchema),
    wrapController(RelationshipTemplateController.updateTemplateById),
);
relationshipTemplateRouter.delete(
    '/:templateId',
    ValidateRequest(deleteTemplateByIdRequestSchema),
    wrapController(RelationshipTemplateController.deleteTemplateById),
);
relationshipTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), wrapController(RelationshipTemplateController.createTemplate));
relationshipTemplateRouter.post(
    '/search',
    ValidateRequest(searchTemplatesRequestSchema),
    wrapController(RelationshipTemplateController.searchTemplates),
);

export default relationshipTemplateRouter;
