import { Router } from 'express';
import GanttsController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createGanttSchema, deleteGanttSchema, getGanttByIdSchema, searchGanttsSchema, updateGanttSchema } from './validator.schema';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
import { validateUserCanCreateGantt, validateUserCanDeleteGantt, validateUserCanUpdateGantt } from './middlewares';

const GanttsRouter: Router = Router();

GanttsRouter.get(
    '/:ganttId',
    ValidateRequest(getGanttByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(GanttsController.getGanttById),
);
GanttsRouter.post('/countOfUsedTemplate/:templateId', wrapController(GanttsController.isPropertyOfTemplateInUsed));
GanttsRouter.post('/', ValidateRequest(createGanttSchema), wrapMiddleware(validateUserCanCreateGantt), wrapController(GanttsController.createGantt));
GanttsRouter.delete(
    '/:ganttId',
    ValidateRequest(deleteGanttSchema),
    wrapMiddleware(validateUserCanDeleteGantt),
    wrapController(GanttsController.deleteGantt),
);
GanttsRouter.put(
    '/:ganttId',
    ValidateRequest(updateGanttSchema),
    wrapMiddleware(validateUserCanUpdateGantt),
    wrapController(GanttsController.updateGantt),
);
GanttsRouter.post(
    '/search',
    ValidateRequest(searchGanttsSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(GanttsController.searchGantts),
);

export default GanttsRouter;
