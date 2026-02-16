import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import UnitsController from './controller';
import { getHierarchyByWorkspaceId } from './validator.schema';

const UnitsProxy = createProxyMiddleware({
    target: `${config.userService.url}${config.userService.unitsRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: config.userService.requestTimeout,
});

const unitsRouter: Router = Router();

unitsRouter.get(
    '/:workspaceId/hierarchy',
    AuthorizerControllerMiddleware.userHasSomePermissions,
    ValidateRequest(getHierarchyByWorkspaceId),
    wrapController(UnitsController.getHierarchyByWorkspace),
);

unitsRouter.use('/', AuthorizerControllerMiddleware.userHasSomePermissions, UnitsProxy);

export default unitsRouter;
