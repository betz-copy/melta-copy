import { Router } from 'express';
import config from '../../config';
import { createWorkspacesController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { validateUserCanSearchEntitiesOfTemplate } from '../instances/middlewares';
import FlowCubeController from './controller';
import { searchFlowCubeRequestSchema } from './validator.schema';

const FlowCubeRouter: Router = Router();
const FlowCubeControllerMiddleware = createWorkspacesController(FlowCubeController);

// entities
FlowCubeRouter.post(
    '/:workspaceId/entities/search/template/:templateId',
    ValidateRequest(searchFlowCubeRequestSchema),
    wrapMiddleware(validateUserCanSearchEntitiesOfTemplate),
    wrapMiddleware(async (req) => {
        req.headers[config.service.dbHeaderName] = req.params.workspaceId;
    }),
    FlowCubeControllerMiddleware('searchFlowCube'),
);

export default FlowCubeRouter;
