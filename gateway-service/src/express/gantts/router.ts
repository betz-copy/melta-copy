import { Router } from 'express';
import { createController } from '@microservices/shared';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import ValidateRequest from '../../utils/joi';
import GanttController from './controller';
import GanttsValidator from './middlewares';
import { createGanttSchema, deleteGanttSchema, getGanttByIdSchema, searchGanttsSchema, updateGanttSchema } from './validator.schema';

const GanttsRouter: Router = Router();

const GanttsControllerMiddleware = createController(GanttController);
const GanttsValidatorMiddleware = createController(GanttsValidator, true);

GanttsRouter.get(
    '/:ganttId',
    ValidateRequest(getGanttByIdSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    GanttsControllerMiddleware.getGanttById,
);
GanttsRouter.post(
    '/',
    ValidateRequest(createGanttSchema),
    GanttsValidatorMiddleware.validateUserCanCreateGantt,
    GanttsControllerMiddleware.createGantt,
);
GanttsRouter.delete(
    '/:ganttId',
    ValidateRequest(deleteGanttSchema),
    GanttsValidatorMiddleware.validateUserCanDeleteGantt,
    GanttsControllerMiddleware.deleteGantt,
);
GanttsRouter.put(
    '/:ganttId',
    ValidateRequest(updateGanttSchema),
    GanttsValidatorMiddleware.validateUserCanUpdateGantt,
    GanttsControllerMiddleware.updateGantt,
);
GanttsRouter.post(
    '/search',
    ValidateRequest(searchGanttsSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    GanttsControllerMiddleware.searchGantts,
);

export default GanttsRouter;
