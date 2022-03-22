import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import * as passport from 'passport';
import authenticationRouter from './authentication/router';
import config from '../config';

const appRouter = Router();

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('/api/auth', authenticationRouter);

if (config.authentication.isRequired) {
    appRouter.use(passport.authenticate('jwt', { session: false }));
}

appRouter.use('/api/config', (_req, res) =>
    res.json({
        contactByMailLink: 'mailAdr@gmail.com',
        contactByChatLink: 'http://chat.com',
    }),
);

appRouter.use(
    ['/api/categories', '/api/entities/templates'],
    createProxyMiddleware({ target: config.entityTemplateManager.uri, onProxyReq: fixRequestBody }),
);

appRouter.use(
    '/api/files',
    createProxyMiddleware({ target: config.storageService.uri, onProxyReq: fixRequestBody }),
);

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
