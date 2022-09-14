import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as passport from 'passport';
import authenticationRouter from './authentication/router';
import usersRouter from './users/router';
import permissionsRouter from './permissions/router';
import config from '../config';
import { wrapMiddleware } from '../utils/express';
import { validateUserHasAtLeastSomePermissions } from './permissions/validateAuthorizationMiddleware';
import templatesRouter from './templates/router';
import instancesRouter from './instances/router';
import ActivityLogRouter from './activityLog/router';
import notificationsRouter from './notifications/router';
import RulesBreachesRouter from './ruleBreaches/router';

const appRouter = Router();

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('/api/auth', authenticationRouter);

if (config.authentication.isRequired) {
    appRouter.use(passport.authenticate('jwt', { session: false }));
} else {
    appRouter.use((req, _res, next) => {
        if (!req.user) req.user = {} as any;
        req.user!.id = config.authentication.mockAuthenticatedUserId;
        next();
    });
}

appRouter.use('/api/config', (_req, res) =>
    res.json({
        contactByMailLink: 'mailAdr@gmail.com',
        contactByChatLink: 'http://chat.com',
    }),
);

appRouter.use('/api/templates', templatesRouter);

appRouter.use('/api/instances', instancesRouter);

appRouter.use(
    '/api/files',
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    createProxyMiddleware({ target: config.storageService.uri, onProxyReq: fixRequestBody }),
);

appRouter.use('/api/users', usersRouter);

appRouter.use('/api/permissions', permissionsRouter);

appRouter.use('/api/activity-log', ActivityLogRouter);

appRouter.use('/api/notifications', notificationsRouter);

appRouter.use('/api/rule-breaches', RulesBreachesRouter);

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
