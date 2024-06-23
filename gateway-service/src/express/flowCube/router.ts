import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../utils/express';
import { searchFlowCubeRequestSchema } from './validator.schema';
import ValidateRequest from '../../utils/joi';
import FlowCubeController from './controller';
import { validateUserCanSearchEntitiesOfTemplate } from '../instances/middlewares';

const FlowCubeRouter: Router = Router();

// entities
FlowCubeRouter.post(
    '/entities/search/template/:templateId',
    ValidateRequest(searchFlowCubeRequestSchema),
    wrapMiddleware(validateUserCanSearchEntitiesOfTemplate),
    wrapController(FlowCubeController.searchFlowCube),
);

export default FlowCubeRouter;
