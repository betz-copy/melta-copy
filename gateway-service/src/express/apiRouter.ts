import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../config';
import { AuthorizerControllerMiddleware } from '../utils/authorizer';
import ActivityLogRouter from './activityLog/router';
import ClientSideRouter from './clientSide/router';
import dashboardItemsRouter from './dashboardItems/router';
import flowCubeRouter from './flowCube/router';
import GanttsRouter from './gantts/router';
import iFramesRouter from './iFrames/router';
import instancesRouter from './instances/router';
import notificationsRouter from './notifications/router';
import processesRouter from './processes/router';
import RulesBreachesRouter from './ruleBreaches/router';
import ChartsRouter from './templateCharts/router';
import templatesRouter from './templates/router';
import unitsRouter from './units/router';
import usersRouter from './users/router';
import workspaceRouter from './workspaces/router';

const apiRouter = Router();

apiRouter.use('/config', (_req, res) =>
    res.json({
        matomoUrl: config.frontendConfig.matotmo.baseUrl,
        matomoSiteId: config.frontendConfig.matotmo.siteId,
        mapLayers: config.frontendConfig.mapLayers,
        textLayers: config.frontendConfig.textLayers,
        deleteEntitiesLimit: config.frontendConfig.agGridLimit.deleteLimit,
        meltaUpdates: config.frontendConfig.meltaUpdates,
        meltaUpdatesDescription: config.frontendConfig.meltaUpdatesDescription,
        isOutsideDevelopment: config.frontendConfig.isOutsideDevelopment,
        maxEntitiesToPrint: config.frontendConfig.maxEntitiesToPrint,
    }),
);

apiRouter.use('/templates', templatesRouter);
apiRouter.use('/instances', instancesRouter);

apiRouter.use('/flow-cube', flowCubeRouter);

apiRouter.use(
    '/files',
    createProxyMiddleware({
        target: `${config.storageService.url}${config.storageService.baseRoute}`,
        changeOrigin: true,
        on: { proxyReq: fixRequestBody },
    }),
    AuthorizerControllerMiddleware.userHasSomePermissions,
);

apiRouter.use(
    '/preview',
    createProxyMiddleware({
        target: `${config.previewService.url}${config.previewService.baseRoute}`,
        changeOrigin: true,
        on: {
            proxyReq: fixRequestBody,
        },
        proxyTimeout: config.previewService.requestTimeout,
    }),
    AuthorizerControllerMiddleware.userHasSomePermissions,
);

apiRouter.use('/processes', processesRouter);

apiRouter.use('/units', unitsRouter);

apiRouter.use('/users', usersRouter);

apiRouter.use('/activity-log', ActivityLogRouter);

apiRouter.use('/notifications', notificationsRouter);

apiRouter.use('/rule-breaches', RulesBreachesRouter);

apiRouter.use('/gantts', GanttsRouter);

apiRouter.use('/iframes', iFramesRouter);

apiRouter.use('/charts', ChartsRouter);

apiRouter.use('/dashboard', dashboardItemsRouter);

apiRouter.use('/workspaces', workspaceRouter);

apiRouter.use('/client-side', ClientSideRouter);

export default apiRouter;
