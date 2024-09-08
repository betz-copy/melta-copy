import { Router } from 'express';
import multer from 'multer';
import IFramesController from './controller';
import { validateUserHasAtLeastSomePermissions, validateUserIsTemplatesManager } from '../permissions/validateAuthorizationMiddleware';
import { createWorkspacesController, wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';
import { validateUserCanCreateIFrame, validateUserCanDeleteIFrame, validateUserCanGetIFrame, validateUserCanUpdateIFrame } from './middlewares';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';

export const iFramesRouter: Router = Router();
const IFramesControllerMiddleware = createWorkspacesController(IFramesController);
const IFramesValidatorMiddleware = createWorkspacesController(IFramesValidator, true);

const {
    service: { uploadsFolderPath },
} = config;

iFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesValidatorMiddleware.validateUserCanGetIFrame,

    // wrapMiddleware(validateUserHasAtLeastSomePermissions),
    // wrapMiddleware(validateUserCanGetIFrame),
    // wrapController(IFramesController.getIFrameById),
//
);

iFramesRouter.post(
    '/',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(createIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanCreateIFrame),
    wrapController(IFramesController.createIFrame),
);

iFramesRouter.put(
    '/:iFrameId',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file'),
    ValidateRequest(updateIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanUpdateIFrame),
    wrapController(IFramesController.updateIFrame),
);
iFramesRouter.delete(
    '/:iFrameId',
    ValidateRequest(deleteIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanDeleteIFrame),
    wrapController(IFramesController.deleteIFrame),
);

iFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapController(IFramesController.searchIFrames),
);

export default iFramesRouter;
