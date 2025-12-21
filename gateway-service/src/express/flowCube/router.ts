import { createController, ValidateRequest, wrapMiddleware } from '@packages/utils';
import { Router } from 'express';
import { translateWorkspaceParameter, translateWorkspaceParameterFlow, translateWorkspaceParameterFlowColumns } from '../../utils/express';
import InstancesValidator from '../instances/middlewares';
import FlowCubeController from './controller';
import validateFlowHeaders from './flowMiddleware';
import {
    getEntityTemplateByIdSchema,
    searchCategoryInWorkspaceSchema,
    searchEntitiesByTemplateSchema,
    searchEntityTemplateSchema,
    searchFlowCubeRequestSchema,
    searchWorkspacesSchema,
} from './validator.schema';

const FlowCubeRouter: Router = Router();
const FlowCubeControllerMiddleware = createController(FlowCubeController);
const InstancesValidatorMiddleware = createController(InstancesValidator, true);

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
