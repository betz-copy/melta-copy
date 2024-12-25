import { Router } from 'express';
import multer from 'multer';
import { createController } from '@microservices/shared';
import IFramesController from './controller';
import { wrapMulter } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { createIFrameSchema, deleteIFrameSchema, getIFrameByIdSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';
import { IFramesValidator } from './middlewares';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';

export const iFramesRouter: Router = Router();
const IFramesControllerMiddleware = createController(IFramesController);
const IFramesValidatorMiddleware = createController(IFramesValidator, true);

const {
    service: { uploadsFolderPath },
} = config;

iFramesRouter.get(
    '/:iFrameId',
    ValidateRequest(getIFrameByIdSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesValidatorMiddleware.validateUserCanGetIFrame,
    IFramesControllerMiddleware.getIFrameById,
);

iFramesRouter.post(
    '/',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(createIFrameSchema),
    AuthorizerControllerMiddleware.userCanWriteTemplates,
    IFramesValidatorMiddleware.validateUserCanCreateIFrame,
    IFramesControllerMiddleware.createIFrame,
);

iFramesRouter.put(
    '/:iFrameId',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
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
