import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Router } from 'express';
import config from '../../config';

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

dashboardItemsRouter.post('/', dashboardItemsServiceProxy);

dashboardItemsRouter.get('/:dashboardItemId', dashboardItemsServiceProxy);

export default dashboardItemsRouter;
