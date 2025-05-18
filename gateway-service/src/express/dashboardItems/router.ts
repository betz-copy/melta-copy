import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Router } from 'express';
import config from '../../config';
import { createWorkspacesController } from '../../utils/express';
import { DashboardController } from './controller';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';

const {
    dashboardService: { url, baseRoute, requestTimeout, dashboard },
} = config;

const dashboardItemsServiceProxy = createProxyMiddleware({
    target: `${url}${baseRoute}${dashboard.baseRoute}`,
    changeOrigin: true,
    on: {
        proxyReq: fixRequestBody,
    },
    proxyTimeout: requestTimeout,
});

const dashboardItemsRouter: Router = Router();

const DashboardControllerMiddleware = createWorkspacesController(DashboardController);
// const DashboarValidatorMiddleware = createWorkspacesController(GanttsValidator, true);

dashboardItemsRouter.post('/', dashboardItemsServiceProxy);

dashboardItemsRouter.get('/:dashboardItemId', dashboardItemsServiceProxy);

dashboardItemsRouter.put('/:dashboardItemId', dashboardItemsServiceProxy);

dashboardItemsRouter.delete('/:dashboardItemId', dashboardItemsServiceProxy);

dashboardItemsRouter.post('/search', AuthorizerControllerMiddleware.userHasSomePermissions, DashboardControllerMiddleware.searchDashboardItems);

export default dashboardItemsRouter;
