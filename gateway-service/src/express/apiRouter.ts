import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { wrapMiddleware } from '../utils/express';
import { validateUserHasAtLeastSomePermissions } from './permissions/validateAuthorizationMiddleware';
import usersRouter from './users/router';
import permissionsRouter from './permissions/router';
import templatesRouter from './templates/router';
import processesRouter from './processes/router';
import instancesRouter from './instances/router';
import ActivityLogRouter from './activityLog/router';
import notificationsRouter from './notifications/router';
import RulesBreachesRouter from './ruleBreaches/router';
import GanttsRouter from './gantts/router';
import config from '../config';

const apiRouter = Router();

apiRouter.use('/config', (_req, res) =>
    res.json({
        contactByMailLink: 'mailAdr@gmail.com',
        contactByChatLink: 'http://chat.com',
    }),
);

apiRouter.use('/templates', templatesRouter);
apiRouter.use('/instances', instancesRouter);

apiRouter.use(
    '/files',
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    createProxyMiddleware({ target: config.storageService.uri, onProxyReq: fixRequestBody }),
);

apiRouter.use('/processes', processesRouter);

apiRouter.use('/users', usersRouter);

apiRouter.use('/permissions', permissionsRouter);

apiRouter.use('/activity-log', ActivityLogRouter);

apiRouter.use('/notifications', notificationsRouter);

apiRouter.use('/rule-breaches', RulesBreachesRouter);

apiRouter.use('/gantts', GanttsRouter);

export default apiRouter;
