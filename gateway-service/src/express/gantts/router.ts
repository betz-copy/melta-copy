import { Router } from 'express';
import { GanttController } from './controller';
import { createWorkspacesController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createGanttSchema, deleteGanttSchema, getGanttByIdSchema, searchGanttsSchema, updateGanttSchema } from './validator.schema';
import { validateUserCanCreateGantt, validateUserCanDeleteGantt, validateUserCanUpdateGantt } from './middlewares';
import { Authorizer } from '../../utils/authorizer';

const GanttsRouter: Router = Router();

const GanttsControllerMiddleware = createWorkspacesController(GanttController);
const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer);

GanttsRouter.get(
    '/:ganttId',
    ValidateRequest(getGanttByIdSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    GanttsControllerMiddleware('getGanttById'),
);
GanttsRouter.post('/', ValidateRequest(createGanttSchema), wrapMiddleware(validateUserCanCreateGantt), GanttsControllerMiddleware('createGantt'));
GanttsRouter.delete(
    '/:ganttId',
    ValidateRequest(deleteGanttSchema),
    wrapMiddleware(validateUserCanDeleteGantt),
    GanttsControllerMiddleware('deleteGantt'),
);
GanttsRouter.put(
    '/:ganttId',
    ValidateRequest(updateGanttSchema),
    wrapMiddleware(validateUserCanUpdateGantt),
    GanttsControllerMiddleware('updateGantt'),
);
GanttsRouter.post(
    '/search',
    ValidateRequest(searchGanttsSchema),
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    GanttsControllerMiddleware('searchGantts'),
);

export default GanttsRouter;
