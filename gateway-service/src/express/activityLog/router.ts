import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../../config';

const { activityLogService: activityLog } = config;

const ActivityLogProxy = createProxyMiddleware({
    target: activityLog.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: activityLog.requestTimeout,
});

const ActivityLogRouter: Router = Router();

ActivityLogRouter.get('*', ActivityLogProxy);

export default ActivityLogRouter;
