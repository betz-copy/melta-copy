import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import SimbaController from './controller';
import {
    getInstancesByTemplateIdSchema,
    countEntitiesOfTemplatesByUserEntityIdSchema,
    getAllSimbaTemplatesSchema,
    searchEntitiesOfTemplateSchema,
    getExpandedEntityByIdRequestSchema,
} from './validator.schema';
import SimbaValidator from './middlewares';

const SimbaRouter: Router = Router();

const SimbaControllerMiddleware = createController(SimbaController);
const SimbaValidatorMiddleware = createController(SimbaValidator, true);

SimbaRouter.post(
    '/templates/all',
    ValidateRequest(getAllSimbaTemplatesSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getAllSimbaTemplates,
);

SimbaRouter.post(
    '/entities/:templateId',
    ValidateRequest(getInstancesByTemplateIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getInstancesByTemplateId,
);

SimbaRouter.post(
    '/entities/count/user-entity-id',
    ValidateRequest(countEntitiesOfTemplatesByUserEntityIdSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.countEntitiesOfTemplatesByUserEntityId,
);

SimbaRouter.post(
    '/entities/search/template/:templateId',
    ValidateRequest(searchEntitiesOfTemplateSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.searchEntitiesOfTemplate,
);

SimbaRouter.post(
    '/entities/expanded/:entityId',
    ValidateRequest(getExpandedEntityByIdRequestSchema),
    SimbaValidatorMiddleware.validateUserCanAccessSimba,
    SimbaControllerMiddleware.getExpandedEntityById,
);

export default SimbaRouter;
