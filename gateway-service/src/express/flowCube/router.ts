import { Router } from 'express';
import { createWorkspacesController, translateWorkspaceParameter, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesValidator } from '../instances/middlewares';
import FlowCubeController from './controller';
import {
    searchTemplatesNameAndIdInWorkspaceSchema,
    getEntityTemplateByIdSchema,
    searchFlowCubeRequestSchema,
    searchEntitiesByTemplateSchema,
} from './validator.schema';

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

FlowCubeRouter.post(
    '/:workspaceId/categories/search',
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchCategoryInWorkspace,
);

FlowCubeRouter.post(
    '/:workspaceId/templates/search',
    ValidateRequest(searchTemplatesNameAndIdInWorkspaceSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchTemplatesNameAndIdInWorkspace,
);

FlowCubeRouter.post(
    '/:workspaceId/templates/templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.getEntityTemplateById,
);

FlowCubeRouter.post(
    '/:workspaceId/templates/search/entities',
    ValidateRequest(searchEntitiesByTemplateSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.searchEntitiesByTemplate,
);

export default FlowCubeRouter;
