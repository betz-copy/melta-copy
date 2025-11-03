import { ValidateRequest } from '@microservices/shared';
import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import { createWorkspacesController } from '../../utils/express';
import DashboardController from './controller';
import DashboardValidator from './middlewares';
import {
    createDashboardRequestSchema,
    deleteDashboardItemRequestSchema,
    editDashboardItemRequestSchema,
    getDashboardItemByIdRequestSchema,
    searchDashboardItemsRequestSchema,
} from './validator.schema';

const { url, baseRoute, requestTimeout, dashboard } = config.dashboardService;

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
const DashboardValidatorMiddleware = createWorkspacesController(DashboardValidator, true);

dashboardItemsRouter.post(
    '/',
    ValidateRequest(createDashboardRequestSchema),
    DashboardValidatorMiddleware.validateUserCanCreateDashboard,
    dashboardItemsServiceProxy,
);

dashboardItemsRouter.get(
    '/:dashboardItemId',
    ValidateRequest(getDashboardItemByIdRequestSchema),
    DashboardValidatorMiddleware.validateUserCanGetDashboardById,
    dashboardItemsServiceProxy,
);

dashboardItemsRouter.put(
    '/:dashboardItemId',
    ValidateRequest(editDashboardItemRequestSchema),
    DashboardValidatorMiddleware.validateUserCanUpdateDashboard,
    dashboardItemsServiceProxy,
);

dashboardItemsRouter.delete(
    '/:dashboardItemId',
    ValidateRequest(deleteDashboardItemRequestSchema),
    DashboardValidatorMiddleware.validateUserCanDeleteDashboard,
    dashboardItemsServiceProxy,
);

dashboardItemsRouter.post(
    '/search',
    ValidateRequest(searchDashboardItemsRequestSchema),
    AuthorizerControllerMiddleware.userHasSomePermissions,
    DashboardControllerMiddleware.searchDashboardItems,
);

export default dashboardItemsRouter;
