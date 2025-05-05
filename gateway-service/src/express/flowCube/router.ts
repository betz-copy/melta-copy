import { Router } from 'express';
import {
    createWorkspacesController,
    translateWorkspaceParameter,
    translateWorkspaceParameterFlow,
    translateWorkspaceParameterFlowColumns,
    wrapMiddleware,
} from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesValidator } from '../instances/middlewares';
import FlowCubeController from './controller';
import {
    getEntityTemplateByIdSchema,
    searchFlowCubeRequestSchema,
    searchEntitiesByTemplateSchema,
    searchCategoryInWorkspaceSchema,
    searchEntityTemplateSchema,
    searchWorkspacesSchema,
} from './validator.schema';
import validateFlowHeaders from './flowMiddleware';

const FlowCubeRouter: Router = Router();
const FlowCubeControllerMiddleware = createWorkspacesController(FlowCubeController);
const InstancesValidatorMiddleware = createWorkspacesController(InstancesValidator, true);

// entities
FlowCubeRouter.post(
    '/:workspaceId/entities/search/template/:templateId',
    ValidateRequest(searchFlowCubeRequestSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesOfTemplate,
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchFlowCube,
);

FlowCubeRouter.use(validateFlowHeaders);

FlowCubeRouter.post('/workspaces/search', ValidateRequest(searchWorkspacesSchema), FlowCubeController.searchWorkspaces);

FlowCubeRouter.post(
    '/categories/search',
    ValidateRequest(searchCategoryInWorkspaceSchema),
    wrapMiddleware(translateWorkspaceParameterFlow),
    FlowCubeControllerMiddleware.searchCategory,
);

FlowCubeRouter.post(
    '/templates/search',
    ValidateRequest(searchEntityTemplateSchema),
    wrapMiddleware(translateWorkspaceParameterFlow),
    FlowCubeControllerMiddleware.searchEntityTemplate,
);

FlowCubeRouter.post(
    '/templates/templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    wrapMiddleware(translateWorkspaceParameterFlowColumns),
    FlowCubeControllerMiddleware.getEntityTemplateById,
);

FlowCubeRouter.post(
    '/templates/search/entities',
    ValidateRequest(searchEntitiesByTemplateSchema),
    wrapMiddleware(translateWorkspaceParameterFlow),
    FlowCubeControllerMiddleware.searchEntitiesByTemplate,
);

export default FlowCubeRouter;
