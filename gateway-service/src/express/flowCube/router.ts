import { Router } from 'express';
import { createWorkspacesController, translateWorkspaceParameter, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesValidator } from '../instances/middlewares';
import FlowCubeController from './controller';
import { getAllTemplatesByNameAndIdSchema, getEntityTemplateByIdSchema, searchFlowCubeRequestSchema } from './validator.schema';

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
    '/:workspaceId/templates',
    ValidateRequest(getAllTemplatesByNameAndIdSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.getAllTemplatesNameAndIdByWorkspaceId,
);

FlowCubeRouter.post(
    '/:workspaceId/templates/templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    InstancesValidatorMiddleware.validateUserCanSearchEntitiesOfTemplate,
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.getEntityTemplateById,
);

export default FlowCubeRouter;
