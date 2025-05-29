import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import SimbaController from './controller';
import { getInstancesByTemplateIdSchema, getAllTemplatesSchema, getEntityChildTemplateByIdSchema } from './validator.schema';
import SimbaValidator, { validateSimbaHeaders } from './middlewares';

const SimbaRouter: Router = Router();

const SimbaControllerMiddleware = createController(SimbaController);
const SimbaValidatorMiddleware = createController(SimbaValidator, true);

SimbaRouter.use(validateSimbaHeaders);

SimbaRouter.get(
    '/all',
    ValidateRequest(getAllTemplatesSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getAllTemplates,
);

SimbaRouter.get(
    '/templates/child/:templateId',
    ValidateRequest(getEntityChildTemplateByIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getEntityChildTemplateById,
);

SimbaRouter.post(
    '/entities/:templateId',
    ValidateRequest(getInstancesByTemplateIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getInstancesByTemplateId,
);

export default SimbaRouter;
