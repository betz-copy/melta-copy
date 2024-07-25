import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../config';
import { Authorizer } from '../utils/authorizer';
import { createWorkspacesController, createWorkspacesProxyMiddleware } from '../utils/express';
import ActivityLogRouter from './activityLog/router';
import flowCubeRouter from './flowCube/router';
import GanttsRouter from './gantts/router';
import instancesRouter from './instances/router';
import notificationsRouter from './notifications/router';
import processesRouter from './processes/router';
import RulesBreachesRouter from './ruleBreaches/router';
import templatesRouter from './templates/router';
import { usersRouter } from './users/router';
import { workspaceRouter } from './workspaces/router';

const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer);

const apiRouter = Router();

apiRouter.use('/config', (_req, res) =>
    res.json({
        contactByMailLink: 'mailAdr@gmail.com',
        contactByChatLink: 'http://chat.com',
    }),
);

apiRouter.use('/templates', templatesRouter);
apiRouter.use('/instances', instancesRouter);

apiRouter.use('/flow-cube', flowCubeRouter);

apiRouter.use(
    '/files',
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    createWorkspacesProxyMiddleware({ target: config.storageService.url, onProxyReq: fixRequestBody }),
);

apiRouter.use(
    '/preview',
    AuthorizerControllerMiddleware('userHasSomePermissions'),
    createProxyMiddleware({ target: config.previewService.url, onProxyReq: fixRequestBody, proxyTimeout: config.previewService.requestTimeout }),
);

apiRouter.use('/processes', processesRouter);

apiRouter.use('/users', usersRouter);

apiRouter.use('/activity-log', ActivityLogRouter);

apiRouter.use('/notifications', notificationsRouter);

apiRouter.use('/rule-breaches', RulesBreachesRouter);

apiRouter.use('/gantts', GanttsRouter);

apiRouter.use('/workspaces', workspaceRouter);

export default apiRouter;
