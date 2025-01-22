import { Router } from 'express';
import { createController } from '@microservices/shared';
import IFramesController from './controller';
import ValidateRequest from '../../utils/joi';
import IFramesValidator from './middlewares';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';

export const iFramesRouter: Router = Router();
const IFramesControllerMiddleware = createController(IFramesController);
const IFramesValidatorMiddleware = createController(IFramesValidator, true);

iFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesValidatorMiddleware.validateUserCanGetIFrame,
    IFramesControllerMiddleware.getIFrameById,
);

iFramesRouter.post(
    '/',
    busboyMiddleware,
    ValidateRequest(createIFrameSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    IFramesValidatorMiddleware.validateUserCanCreateIFrame,
    IFramesControllerMiddleware.createIFrame,
);

iFramesRouter.put(
    '/:iFrameId',
    busboyMiddleware,
    ValidateRequest(updateIFrameSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    IFramesValidatorMiddleware.validateUserCanUpdateIFrame,
    IFramesControllerMiddleware.updateIFrame,
);
iFramesRouter.delete(
    '/:iFrameId',
    ValidateRequest(deleteIFrameSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    IFramesValidatorMiddleware.validateUserCanDeleteIFrame,
    IFramesControllerMiddleware.deleteIFrame,
);

iFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesControllerMiddleware.searchIFrames,
);

export default iFramesRouter;
