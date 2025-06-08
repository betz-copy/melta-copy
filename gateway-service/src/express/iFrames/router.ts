import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import IFramesController from './controller';
import IFramesValidator from './middlewares';
import { createIFrameSchema, deleteIFrameSchema, searchIFramesSchema, updateIFrameSchema } from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';
import config from '../../config';

const {
    dashboardService: { url, baseRoute, requestTimeout, iframes },
} = config;

const IframesServiceProxy = createProxyMiddleware({
    target: `${url}${baseRoute}${iframes.baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: requestTimeout,
});

export const iFramesRouter: Router = Router();
const IFramesControllerMiddleware = createController(IFramesController);
const IFramesValidatorMiddleware = createController(IFramesValidator, true);

iFramesRouter.get(
    '/:iFrameId',
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesValidatorMiddleware.validateUserCanGetIFrame,
    IframesServiceProxy,
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
    IframesServiceProxy,
);

iFramesRouter.post(
    '/search',
    ValidateRequest(searchIFramesSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    IFramesControllerMiddleware.searchIFrames,
);

export default iFramesRouter;
