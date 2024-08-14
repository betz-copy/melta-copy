import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';
import config from '../../config';

const { activityLogService: activityLog } = config;

const ActivityLogProxy = createProxyMiddleware({
    target: activityLog.url,
    onProxyReq: fixRequestBody,
    proxyTimeout: activityLog.requestTimeout,
} as Options);

const ActivityLogRouter: Router = Router();

ActivityLogRouter.get('*', ActivityLogProxy);

export default ActivityLogRouter;
