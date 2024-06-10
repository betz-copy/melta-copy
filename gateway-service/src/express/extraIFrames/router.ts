import { Router } from 'express';
import IFramesController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getIFrameByIdSchema, createIFrameSchema, deleteIFrameSchema, updateIFrameSchema, searchIFramesSchema } from './validator.schema';
import { validateUserHasAtLeastSomePermissions } from '../permissions/validateAuthorizationMiddleware';
import { validateUserCanCreateIFrame, validateUserCanDeleteIFrame, validateUserCanUpdateIFrame } from './middlewares';

const IFramesRouter: Router = Router();

IFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(IFramesController.getIFrameById),
);
IFramesRouter.post(
    '/',
    ValidateRequest(createIFrameSchema),
    wrapMiddleware(validateUserCanCreateIFrame),
    wrapController(IFramesController.createIFrame),
);
IFramesRouter.delete(
    '/:iFrameId',
    ValidateRequest(deleteIFrameSchema),
    wrapMiddleware(validateUserCanDeleteIFrame),
    wrapController(IFramesController.deleteIFrame),
);
IFramesRouter.put(
    '/:iFrameId',
    ValidateRequest(updateIFrameSchema),
    wrapMiddleware(validateUserCanUpdateIFrame),
    wrapController(IFramesController.updateIFrame),
);
IFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(IFramesController.searchIFrames),
);

export default IFramesRouter;
