import { Router } from 'express';
import multer from 'multer';
import IFramesController from './controller';
import { validateUserHasAtLeastSomePermissions, validateUserIsTemplatesManager } from '../permissions/validateAuthorizationMiddleware';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createIFrameSchema,
    deleteIFrameSchema,
    getExternalSiteByIdSchema,
    getIFrameByIdSchema,
    searchIFramesSchema,
    // updateIFrameSchema,
} from './validator.schema';
import { validateUserCanCreateIFrame, validateUserCanDeleteIFrame, validateUserCanGetIFrame } from './middlewares';
import config from '../../config';

export const iFramesRouter: Router = Router();

const {
    service: { uploadsFolderPath },
} = config;

iFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapMiddleware(validateUserCanGetIFrame),
    wrapController(IFramesController.getIFrameById),
);

iFramesRouter.get(
    '/externalSite/:iFrameId',
    ValidateRequest(getExternalSiteByIdSchema),
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    wrapMiddleware(validateUserCanGetIFrame),
    wrapController(IFramesController.getExternalSiteById),
);

iFramesRouter.post(
    '/',
    ValidateRequest(createIFrameSchema),
    wrapMiddleware(validateUserIsTemplatesManager),
    wrapMiddleware(validateUserCanCreateIFrame),
    wrapController(IFramesController.createIFrame),
);

iFramesRouter.put(
    '/:iFrameId',
    multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).any(), //  .single('file'),
    // ValidateRequest(updateIFrameSchema),
    // wrapMiddleware(validateUserIsTemplatesManager),
    // wrapMiddleware(validateUserCanUpdateIFrame),
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
