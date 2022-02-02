import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../config';

const appRouter = Router();

appRouter.use('/api/config', (_req, res) =>
    res.json({
        contactByMailLink: 'mailAdr@gmail.com',
        contactByChatLink: 'http://chat.com',
    }),
);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use(
    ['/api/categories', '/api/entities/templates'],
    createProxyMiddleware({ target: config.service.entityTemplateManagerUrl, onProxyReq: fixRequestBody }),
);

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
