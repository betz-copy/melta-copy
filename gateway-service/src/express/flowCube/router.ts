import { Router } from 'express';
import { createWorkspacesController, translateWorkspaceParameter, translateWorkspaceParameterFlow, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesValidator } from '../instances/middlewares';
import FlowCubeController from './controller';
import {
    getEntityTemplateByIdSchema,
    searchFlowCubeRequestSchema,
    searchEntitiesByTemplateSchema,
    searchCategoryInWorkspaceSchema,
    searchTemplatesSchema,
    searchWorkspacesSchema,
} from './validator.schema';
import validateFlowHeaders from './flowMiddleware';
// import { AuthorizerControllerMiddleware } from '../../utils/authorizer';

const FlowCubeRouter: Router = Router();
const FlowCubeControllerMiddleware = createWorkspacesController(FlowCubeController);
const InstancesValidatorMiddleware = createWorkspacesController(InstancesValidator, true);

FlowCubeRouter.use(validateFlowHeaders);

// entities
FlowCubeRouter.post(
    '/:workspaceId/entities/search/template/:templateId',
    ValidateRequest(searchFlowCubeRequestSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesOfTemplate,
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchFlowCube,
);

FlowCubeRouter.post('/workspaces/search', ValidateRequest(searchWorkspacesSchema), FlowCubeControllerMiddleware.searchWorkspaces);

FlowCubeRouter.post(
    '/categories/search',
    ValidateRequest(searchCategoryInWorkspaceSchema),
    wrapMiddleware(translateWorkspaceParameterFlow),
    FlowCubeControllerMiddleware.searchCategory,
);

FlowCubeRouter.post(
    '/templates/search',
    ValidateRequest(searchTemplatesSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchTemplates,
);

FlowCubeRouter.post(
    '/templates/templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.getEntityTemplateById,
);

FlowCubeRouter.post(
    '/templates/search/entities',
    ValidateRequest(searchEntitiesByTemplateSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchEntitiesByTemplate,
);

export default FlowCubeRouter;
