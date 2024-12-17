import { Router } from 'express';
import { createWorkspacesController, translateWorkspaceParameter, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { InstancesValidator } from '../instances/middlewares';
import FlowCubeController from './controller';
import { getAllTemplatesByNameAndIdSchema, searchFlowCubeRequestSchema } from './validator.schema';

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

FlowCubeRouter.get(
    '/:workspaceId/templates',
    ValidateRequest(getAllTemplatesByNameAndIdSchema),
    wrapMiddleware(translateWorkspaceParameter),
    FlowCubeControllerMiddleware.getAllTemplatesNameAndIdByWorkspaceId,
);

export default FlowCubeRouter;
